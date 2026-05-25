import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { _supabase } from './supabase';
import { useAuth } from './auth';
import { useTweaks, TweaksPanel, TweakSection, TweakToggle, TweakColor, TweakRadio } from './tweaks';
import { THEMES, useToast, extractVars } from './ui';
import { SAMPLE_PROMPTS } from './data';

// Components
import { TopBar, MobileFilterBar } from './components/topbar';
import { Sidebar } from './components/sidebar';
import { ListView, Splitter } from './components/list-view';
import { GridView } from './components/grid-view';
import { Detail } from './components/detail';
import { BulkBar, ConfirmDeleteModal } from './components/bulk-bar';
import { Editor } from './components/editor';
import { VarFiller } from './components/var-filler';
import { PromptPreview } from './components/preview';
import { ExploreView } from './components/explore';

export default function App() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  const theme  = THEMES[t.theme] || THEMES.amber;
  const accent = theme.accent;
  const accentInk = theme.accentInk;
  const accentSoft = t.dark ? `${theme.accent}26` : theme.soft;

  // ── Auth + sync state ──────────────────────────────────────────────────────
  const authState = useAuth();
  const { user, signIn, signOut } = authState;

  // ── Splash screen: desvanece una vez que React pintó el primer frame ────────
  useEffect(() => {
    const el = document.getElementById('splash');
    if (!el) return;
    // requestAnimationFrame doble garantiza que el DOM ya fue pintado
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.add('splash-hide');
        const onEnd = () => el.remove();
        el.addEventListener('transitionend', onEnd, { once: true });
        // fallback: si la transición nunca dispara (ej. prefers-reduced-motion)
        const t = setTimeout(onEnd, 500);
        el.addEventListener('transitionend', () => clearTimeout(t), { once: true });
      });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // expose CSS vars
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--accent-soft", t.dark ? `${accent}26` : accentSoft);
  }, [accent, accentSoft, t.dark]);

  // dark mode toggle on <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", !!t.dark);
  }, [t.dark]);

  const [prompts, setPrompts] = useState(() => {
    try {
      const saved = localStorage.getItem('stash:prompts');
      const parsed = saved ? JSON.parse(saved) : null;
      const raw = Array.isArray(parsed) ? parsed : SAMPLE_PROMPTS;
      return raw.map(p => p.updated_at ? p : { ...p, updated_at: '2020-01-01T00:00:00.000Z' });
    } catch(e) { return SAMPLE_PROMPTS; }
  });

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState({ scope: "all", ai: null, tags: [] });
  const [libSort, setLibSort] = useState("recent");
  const [libDir, setLibDir] = useState("desc");
  const [view, setView] = useState(t.defaultView || "list");
  const [selId, setSel] = useState(prompts[0]?.id ?? null);
  const [editor, setEditor] = useState({ open: false, draft: null });
  const [filler, setFiller] = useState({ open: false, prompt: null });
  const [previewId, setPreviewId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [section, setSection] = useState("library");
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [detailWidth, setDetailWidth] = useState(() => {
    try { return Math.max(280, Math.min(720, Number(localStorage.getItem("stash:detailWidth")) || 380)); }
    catch (e) { return 380; }
  });
  const mainRef = useRef(null);
  const [toast, showToast] = useToast();

  // Persistir prompts en localStorage
  useEffect(() => {
    try { localStorage.setItem('stash:prompts', JSON.stringify(prompts)); }
    catch(e) {}
  }, [prompts]);

  // ── Sync con Supabase ──────────────────────────────────────────────────────
  const syncWithCloud = useCallback(async (currentPrompts, userId) => {
    if (!_supabase) return { merged: null, error: 'Supabase no configurado' };
    authState.setSyncing(true);
    authState.setSyncError(null);
    try {
      const { data: remote, error: fetchErr } = await _supabase
        .from('prompts').select('*').eq('user_id', userId);
      if (fetchErr) throw fetchErr;

      const remoteMap  = new Map((remote || []).map(r => [String(r.id), r]));
      const localMap   = new Map(currentPrompts.map(l => [String(l.id), l]));
      const allIds     = new Set([...remoteMap.keys(), ...localMap.keys()]);
      const merged     = [];

      // Si el usuario ya tiene prompts en la nube, los locales que sean de ejemplo
      // (IDs coinciden con SAMPLE_PROMPTS) no se incluyen ni se suben.
      const hasRemoteData = (remote || []).length > 0;
      const sampleIds = new Set(SAMPLE_PROMPTS.map(p => String(p.id)));

      for (const id of allIds) {
        const loc = localMap.get(id);
        const rem = remoteMap.get(id);
        if (loc && !rem) {
          if (hasRemoteData && sampleIds.has(id)) continue; // ignorar samples si ya hay datos en la nube
          merged.push(loc);
          continue;
        }
        if (!loc && rem) { const { user_id, ...r } = rem; merged.push(r); continue; }
        const lt = new Date(loc.updated_at || 0).getTime();
        const rt = new Date(rem.updated_at || 0).getTime();
        if (lt >= rt) {
          merged.push({ ...loc, creator_name: loc.creator_name || rem.creator_name || null });
        } else {
          const { user_id, ...r } = rem; merged.push(r);
        }
      }

      const rows = merged.map(p => ({
        id: p.id, user_id: userId,
        title: p.title || '', body: p.body || '',
        ai: p.ai || 'generic', tags: p.tags || [],
        star: p.star || false, uses: p.uses || 0,
        edited: p.edited || 'just now',
        updated_at: p.updated_at || new Date().toISOString(),
        public: p.public || false,
        creator_name: p.creator_name || null,
        source_id: p.source_id || null,
      }));
      const { error: upErr } = await _supabase.from('prompts')
        .upsert(rows, { onConflict: 'id,user_id' });
      if (upErr) throw upErr;

      return { merged, error: null };
    } catch (err) {
      return { merged: null, error: err.message || 'Sync failed' };
    } finally {
      authState.setSyncing(false);
    }
  }, []);

  const pushPromptToCloud = useCallback(async (p) => {
    if (!user || !_supabase) return;
    try {
      let creator_verified = false;
      if (p.public) {
        const { data: profile } = await _supabase
          .from('profiles').select('verified').eq('user_id', user.id).single();
        creator_verified = profile?.verified || false;
      }
      const { error } = await _supabase.from('prompts').upsert({
        id: p.id, user_id: user.id,
        title: p.title || '', body: p.body || '',
        ai: p.ai || 'generic', tags: p.tags || [],
        star: p.star || false, uses: p.uses || 0,
        edited: p.edited || 'just now',
        updated_at: p.updated_at || new Date().toISOString(),
        public: !!p.public,
        creator_name: p.creator_name || null,
        creator_verified,
        source_id: p.source_id || null,
      }, { onConflict: 'id,user_id' });
      if (error) throw error;
    } catch (err) {
      console.warn('[Stash] Error pushing to cloud:', err.message);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { merged, error } = await syncWithCloud(prompts, user.id);
      if (error) {
        authState.setSyncError(error);
        showToast('Sync failed', 'error');
      } else {
        setPrompts(merged);
        authState.setLastSync(Date.now());
        showToast('Synced with cloud ☁', 'ok');
      }
    })();
  }, [user?.id]);

  const handleManualSync = async () => {
    if (!user) return;
    const { merged, error } = await syncWithCloud(prompts, user.id);
    if (error) {
      authState.setSyncError(error);
      showToast('Sync failed', 'error');
    } else {
      setPrompts(merged);
      authState.setLastSync(Date.now());
      showToast('Synced ☁', 'ok');
    }
  };

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 820);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { if (t.defaultView && t.defaultView !== view) setView(t.defaultView); }, [t.defaultView]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      const inField = tag === "input" || tag === "textarea";
      if (e.key === "/" && !inField) { e.preventDefault(); document.querySelector('input[placeholder^="Search"]')?.focus(); }
      if ((e.key === "n" || e.key === "N") && !inField && !e.metaKey && !e.ctrlKey) { e.preventDefault(); openNew(); }
      if (e.key === "Escape" && selectedIds.size > 0 && !inField) clearSelection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    let items = prompts.filter(p => {
      if (filter.scope === "starred" && !p.star) return false;
      if (filter.scope === "shared"  && !p.public) return false;
      if (filter.ai && p.ai !== filter.ai) return false;
      if (filter.tags && filter.tags.length > 0) {
        if (!filter.tags.every(t => (p.tags || []).includes(t))) return false;
      }
      if (ql) {
        const hay = (p.title + " " + p.body + " " + (p.tags || []).join(" ") + " " + p.ai).toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });

    items.sort((a, b) => {
      let vA, vB;
      if (libSort === "alpha") {
        vA = (a.title || "").toLowerCase();
        vB = (b.title || "").toLowerCase();
      } else if (libSort === "uses") {
        vA = a.uses || 0;
        vB = b.uses || 0;
      } else {
        vA = new Date(a.updated_at || 0).getTime();
        vB = new Date(b.updated_at || 0).getTime();
      }
      if (vA === vB) return 0;
      const res = vA > vB ? 1 : -1;
      return libDir === "asc" ? res : -res;
    });

    return items;
  }, [prompts, q, filter, libSort, libDir]);

  const sel = filtered.find(p => p.id === selId) || filtered[0] || null;
  useEffect(() => {
    if (!filtered.find(p => p.id === selId) && filtered[0]) setSel(filtered[0].id);
  }, [filtered]);

  const toggleStar = (id) => {
    const now = new Date().toISOString();
    setPrompts(ps => ps.map(p => {
      if (p.id === id) {
        const updated = { ...p, star: !p.star, updated_at: now };
        pushPromptToCloud(updated);
        return updated;
      }
      return p;
    }));
  };

  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const selectAllVisible = (ids, clear = false) => setSelectedIds(clear ? new Set() : new Set(ids));
  const clearSelection = () => setSelectedIds(new Set());
  const requestBulkDelete = () => setConfirmBulk(true);
  const bulkDelete = async () => {
    const count = selectedIds.size;
    const ids = new Set(selectedIds);
    setPrompts(ps => ps.filter(p => !ids.has(p.id)));
    setSelectedIds(new Set());
    setConfirmBulk(false);
    showToast(`Deleted ${count} prompt${count !== 1 ? "s" : ""}`, "ok");
    if (user && _supabase) {
      await _supabase.from('prompts').delete().in('id', [...ids]).eq('user_id', user.id);
    }
  };

  const onCopy = async (p) => {
    if (extractVars(p.body).length > 0) {
      setFiller({ open: true, prompt: p });
      return;
    }
    try { await navigator.clipboard.writeText(p.body); } catch (e) {}
    const now = new Date().toISOString();
    setPrompts(ps => ps.map(x => {
      if (x.id === p.id) {
        const updated = { ...x, uses: x.uses + 1, updated_at: now };
        pushPromptToCloud(updated);
        return updated;
      }
      return x;
    }));
    showToast("Copied to clipboard", "ok");
  };

  const onFillerConfirm = async (text) => {
    try { await navigator.clipboard.writeText(text); } catch (e) {}
    if (filler.prompt) {
      const now = new Date().toISOString();
      setPrompts(ps => ps.map(x => {
        if (x.id === filler.prompt.id) {
          const updated = { ...x, uses: x.uses + 1, updated_at: now };
          pushPromptToCloud(updated);
          return updated;
        }
        return x;
      }));
    }
    setFiller({ open: false, prompt: null });
    showToast("Copied to clipboard", "ok");
  };

  const openNew = () => setEditor({
    open: true,
    draft: { title: "", body: "", ai: filter.ai || "claude", tags: [...(filter.tags || [])], star: filter.scope === "starred" }
  });
  const openEdit = (p) => setEditor({ open: true, draft: { ...p } });
  const saveDraft = async () => {
    const d = editor.draft;
    if (!d.title.trim()) { showToast("Add a title first"); return; }
    const creatorName = d.public && user ? (user.user_metadata?.full_name || user.user_metadata?.name || user.email) : (d.creator_name || null);
    let savedPrompt;
    if (d.id) {
      savedPrompt = { ...d, creator_name: creatorName, edited: "just now", updated_at: new Date().toISOString() };
      setPrompts(ps => ps.map(x => x.id === d.id ? { ...x, ...savedPrompt } : x));
      showToast("Saved", "ok");
    } else {
      savedPrompt = { ...d, creator_name: creatorName, id: crypto.randomUUID(), uses: 0, edited: "just now", updated_at: new Date().toISOString() };
      setPrompts(ps => [savedPrompt, ...ps]);
      setSel(savedPrompt.id);
      showToast("Prompt saved", "ok");
    }
    setEditor({ open: false, draft: null });
    pushPromptToCloud(savedPrompt);
  };

  const saveFromCommunity = (communityPrompt) => {
    if (!user) { showToast("Sign in to save prompts", "error"); return; }
    if (communityPrompt.user_id === user.id) { showToast("Este prompt ya es tuyo 👆", "error"); return; }
    const alreadySaved = prompts.some(p => p.id === communityPrompt.id || p.source_id === communityPrompt.id);
    if (alreadySaved) { showToast("Ya tenés este prompt guardado", "error"); return; }
    const { user_id, creator_name, creator_verified, saves, public: _pub, ...rest } = communityPrompt;
    const now = new Date().toISOString();
    const copy = { ...rest, id: crypto.randomUUID(), source_id: communityPrompt.id, star: false, uses: 0, edited: "just now", updated_at: now, public: false };
    setPrompts(ps => [copy, ...ps]);
    showToast("Saved to your library ✓", "ok");
    if (_supabase && user) {
      pushPromptToCloud(copy);
      _supabase.rpc('increment_prompt_saves', { prompt_id: communityPrompt.id });
    }
  };

  const onDelete = async (id) => {
    setPrompts(ps => ps.filter(p => p.id !== id));
    showToast("Deleted");
    if (user && _supabase) {
      await _supabase.from('prompts').delete().match({ id, user_id: user.id });
    }
  };

  const onUnpublish = async (id) => {
    const now = new Date().toISOString();
    setPrompts(ps => ps.map(p => {
      if (p.id === id) {
        const updated = { ...p, public: false, updated_at: now };
        pushPromptToCloud(updated);
        return updated;
      }
      return p;
    }));
    showToast("Quitado de Explore", "ok");
  };

  const accountProps = { user, loading: authState.loading, syncing: authState.syncing, lastSync: authState.lastSync, syncError: authState.syncError, signIn, signOut, onSync: handleManualSync };

  const onTagClick = (t) => {
    setSection("library");
    const tags = filter.tags || [];
    const nextTags = tags.includes(t) ? tags.filter(tag => tag !== t) : [...tags, t];
    setFilter({ ...filter, tags: nextTags });
  };

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", color: "var(--text)", fontFamily: "'Geist', system-ui, -apple-system, 'Segoe UI', sans-serif", fontSize: 14 }}>
      <TopBar q={q} setQ={setQ} view={view} setView={setView} onNew={openNew} accent={accent} accentInk={accentInk} onMenu={() => setMobileSidebar(true)} isMobile={isMobile} dark={!!t.dark} onToggleDark={() => setTweak("dark", !t.dark)} section={section} libSort={libSort} setLibSort={setLibSort} libDir={libDir} setLibDir={setLibDir} />
      {isMobile && <MobileFilterBar filter={filter} setFilter={setFilter} prompts={prompts} accent={accent} section={section} libSort={libSort} setLibSort={setLibSort} libDir={libDir} setLibDir={setLibDir} onSync={handleManualSync} syncing={authState.syncing} />}
      <div style={{ flex: 1, display: "flex", minHeight: 0, position: "relative" }}>
        {!isMobile && <Sidebar prompts={prompts} filter={filter} setFilter={setFilter} accent={accent} accentSoft={accentSoft} accountProps={accountProps} section={section} setSection={setSection} />}
        {isMobile && mobileSidebar && (
          <div
            onClick={() => setMobileSidebar(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(26,22,18,.35)", zIndex: 100, animation: "stashFadeIn .15s ease-out" }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", inset: 0, animation: "slideInLeft .2s cubic-bezier(.2,.7,.3,1)" }}>
              <Sidebar
                prompts={prompts} filter={filter}
                setFilter={(f) => { setFilter(f); setMobileSidebar(false); }}
                accent={accent} accentSoft={accentSoft}
                isMobile={true} onClose={() => setMobileSidebar(false)}
                accountProps={accountProps} section={section}
                setSection={(s) => { setSection(s); setMobileSidebar(false); }}
              />
            </div>
          </div>
        )}
        <main ref={mainRef} style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: view === "list" ? "var(--surface)" : "var(--bg)" }}>
          {section === "library" && <BulkBar count={selectedIds.size} total={filtered.length} onSelectAll={() => selectAllVisible(filtered.map(p => p.id))} onClear={clearSelection} onDelete={requestBulkDelete} />}
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {section === "explore" ? <ExploreView accent={accent} accentSoft={accentSoft} accentInk={accentInk} user={user} onSave={saveFromCommunity} showToast={showToast} view={view} density={t.density} /> : view === "list" ? <ListView prompts={filtered} selId={sel?.id} setSel={(id) => { setSel(id); if (isMobile) setMobileDetail(true); }} toggleStar={toggleStar} accent={accent} density={t.density} selectedIds={selectedIds} onToggleSelect={toggleSelect} onSelectAllVisible={selectAllVisible} onTagClick={onTagClick} activeTags={filter.tags} /> : <GridView prompts={filtered} setSel={(id) => { setSel(id); if (isMobile) setMobileDetail(true); else setPreviewId(id); }} toggleStar={toggleStar} accent={accent} density={t.density} onCopy={onCopy} onEdit={openEdit} selectedIds={selectedIds} onToggleSelect={toggleSelect} onTagClick={onTagClick} activeTags={filter.tags} />}
          {section === "library" && view === "list" && !isMobile && (
            <React.Fragment>
              <Splitter accent={accent} onDrag={(clientX) => {
                if (clientX === null) { setDetailWidth(380); return; }
                const r = mainRef.current?.getBoundingClientRect();
                if (!r) return;
                const w = Math.max(280, Math.min(Math.min(720, r.width - 320), r.right - clientX));
                setDetailWidth(w);
              }} />
              <Detail p={sel} accent={accent} accentSoft={accentSoft} toggleStar={toggleStar} onCopy={onCopy} onEdit={openEdit} onDelete={onDelete} onUnpublish={onUnpublish} isMobile={false} width={detailWidth} onTagClick={onTagClick} activeTags={filter.tags} />
            </React.Fragment>
          )}
          </div>
        </main>
        {isMobile && mobileDetail && sel && (
          <div style={{ position: "absolute", inset: 0, background: "var(--bg)", zIndex: 90, display: "flex", flexDirection: "column", animation: "slideInRight .2s cubic-bezier(.2,.7,.3,1)" }}>
            <Detail p={sel} accent={accent} accentSoft={accentSoft} toggleStar={toggleStar} onCopy={onCopy} onEdit={openEdit} onDelete={(id) => { onDelete(id); setMobileDetail(false); }} onUnpublish={onUnpublish} isMobile={true} onClose={() => setMobileDetail(false)} onTagClick={onTagClick} activeTags={filter.tags} />
          </div>
        )}
      </div>
      <Editor open={editor.open} draft={editor.draft} setDraft={(d) => setEditor({ ...editor, draft: d })} onSave={saveDraft} onClose={() => setEditor({ open: false, draft: null })} accent={accent} accentInk={accentInk} user={user} />
      <VarFiller open={filler.open} prompt={filler.prompt} onClose={() => setFiller({ open: false, prompt: null })} onConfirm={onFillerConfirm} accent={accent} accentInk={accentInk} />
      <PromptPreview open={previewId !== null && !isMobile} prompt={filtered.find(p => p.id === previewId)} onClose={() => setPreviewId(null)} accent={accent} accentSoft={accentSoft} accentInk={accentInk} toggleStar={toggleStar} onCopy={onCopy} onEdit={(p) => { setPreviewId(null); openEdit(p); }} onDelete={(id) => { onDelete(id); setPreviewId(null); }} onUnpublish={onUnpublish} onPrev={() => { const i = filtered.findIndex(p => p.id === previewId); if (i > 0) { setPreviewId(filtered[i - 1].id); setSel(filtered[i - 1].id); } }} onNext={() => { const i = filtered.findIndex(p => p.id === previewId); if (i >= 0 && i < filtered.length - 1) { setPreviewId(filtered[i + 1].id); setSel(filtered[i + 1].id); } }} hasPrev={filtered.findIndex(p => p.id === previewId) > 0} hasNext={filtered.findIndex(p => p.id === previewId) >= 0 && filtered.findIndex(p => p.id === previewId) < filtered.length - 1} />
      <ConfirmDeleteModal open={confirmBulk} count={selectedIds.size} onConfirm={bulkDelete} onCancel={() => setConfirmBulk(false)} />
      {toast}
      <TweaksPanel>
        <TweakSection label="Appearance" />
        <TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
        <TweakColor label="Accent" value={t.theme} options={Object.keys(THEMES).map(k => THEMES[k].accent)} onChange={(v) => setTweak("theme", Object.keys(THEMES).find(k => THEMES[k].accent === v) || "amber")} />
        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={t.density} options={["compact", "regular", "spacious"]} onChange={(v) => setTweak("density", v)} />
        <TweakRadio label="Default view" value={t.defaultView} options={["list", "grid"]} onChange={(v) => { setTweak("defaultView", v); setView(v); }} />
      </TweaksPanel>
    </div>
  );
}
