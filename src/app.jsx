// src/app.jsx — App() root component (state, sync, layout)

function App() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  const theme  = THEMES[t.theme] || THEMES.amber;
  const accent = theme.accent;
  const accentInk = theme.accentInk;
  const accentSoft = t.dark ? `${theme.accent}26` : theme.soft;

  // ── Auth + sync state ──────────────────────────────────────────────────────
  const authState = useAuth();
  const { user, signIn, signOut } = authState;

  // expose CSS vars
  React.useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
    // In dark mode the "soft" tint from THEMES is too bright on dark surfaces —
    // fall back to a low-opacity wash of the accent itself.
    document.documentElement.style.setProperty("--accent-soft", t.dark ? `${accent}26` : accentSoft);
  }, [accent, accentSoft, t.dark]);

  // dark mode toggle on <html>
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", !!t.dark);
  }, [t.dark]);

  const [prompts, setPrompts] = React.useState(() => {
    try {
      const saved = localStorage.getItem('stash:prompts');
      const parsed = saved ? JSON.parse(saved) : null;
      // Primera vez que se abre (sin datos guardados) → carga los ejemplos
      // Si hay datos guardados (aunque sea array vacío) → respeta lo guardado
      const raw = Array.isArray(parsed) ? parsed : SAMPLE_PROMPTS;
      // Backfill updated_at: los prompts sin fecha usan una fecha antigua para que
      // los datos de Supabase siempre ganen en el primer sync (si los hay).
      return raw.map(p => p.updated_at ? p : { ...p, updated_at: '2020-01-01T00:00:00.000Z' });
    } catch(e) { return SAMPLE_PROMPTS; }
  });
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState({ scope: "all", ai: null, tags: [] });
  const [libSort, setLibSort] = React.useState("recent"); // "recent" | "alpha" | "uses"
  const [libDir, setLibDir] = React.useState("desc"); // "asc" | "desc"
  const [view, setView] = React.useState(t.defaultView || "list");
  const [selId, setSel] = React.useState(prompts[0]?.id ?? null);
  const [editor, setEditor] = React.useState({ open: false, draft: null });
  const [filler, setFiller] = React.useState({ open: false, prompt: null });
  const [previewId, setPreviewId] = React.useState(null);
  const [selectedIds, setSelectedIds] = React.useState(new Set());
  const [confirmBulk, setConfirmBulk] = React.useState(false);
  const [section, setSection] = React.useState("library"); // "library" | "explore"
  const [mobileSidebar, setMobileSidebar] = React.useState(false);
  const [mobileDetail, setMobileDetail] = React.useState(false);
  const [detailWidth, setDetailWidth] = React.useState(() => {
    try { return Math.max(280, Math.min(720, Number(localStorage.getItem("stash:detailWidth")) || 380)); }
    catch (e) { return 380; }
  });
  const mainRef = React.useRef(null);
  const [toast, showToast] = useToast();

  // Persistir prompts en localStorage cada vez que cambian
  React.useEffect(() => {
    try { localStorage.setItem('stash:prompts', JSON.stringify(prompts)); }
    catch(e) {}
  }, [prompts]);

  // ── Sync con Supabase ──────────────────────────────────────────────────────
  // Merge bidireccional: last-write-wins por updated_at
  const syncWithCloud = React.useCallback(async (currentPrompts, userId) => {
    if (!_supabase) return { merged: null, error: 'Supabase no configurado' };
    authState.setSyncing(true);
    authState.setSyncError(null);
    try {
      const { data: remote, error: fetchErr } = await _supabase
        .from('prompts').select('*').eq('user_id', userId);
      if (fetchErr) throw fetchErr;

      // Normalizar IDs a string para que 1 (number) y "1" (string de Supabase)
      // no se traten como claves distintas en el Map y generen duplicados en el upsert.
      const remoteMap = new Map((remote || []).map(r => [String(r.id), r]));
      const localMap  = new Map(currentPrompts.map(l => [String(l.id), l]));
      const allIds    = new Set([...remoteMap.keys(), ...localMap.keys()]);
      const merged    = [];

      for (const id of allIds) {
        const loc = localMap.get(id);
        const rem = remoteMap.get(id);
        if (loc && !rem) { merged.push(loc); continue; }
        if (!loc && rem) { const { user_id, ...r } = rem; merged.push(r); continue; }
        const lt = new Date(loc.updated_at || 0).getTime();
        const rt = new Date(rem.updated_at || 0).getTime();
        if (lt >= rt) {
          // Local gana: preservar campos server-only que no se guardan localmente
          merged.push({ ...loc, creator_name: loc.creator_name || rem.creator_name || null });
        } else {
          const { user_id, ...r } = rem; merged.push(r);
        }
      }

      // Upsert el conjunto ganador a Supabase
      const rows = merged.map(p => ({
        id: p.id, user_id: userId,
        title: p.title || '', body: p.body || '',
        ai: p.ai || 'generic', tags: p.tags || [],
        star: p.star || false, uses: p.uses || 0,
        edited: p.edited || 'just now',
        updated_at: p.updated_at || new Date().toISOString(),
        public: p.public || false,
        creator_name: p.creator_name || null,
        source_id: p.source_id || null,  // origen del prompt si fue copiado de la comunidad
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

  const pushPromptToCloud = React.useCallback(async (p) => {
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

  // Auto-sync al hacer login (dispara cuando user.id pasa de null a un UUID)
  React.useEffect(() => {
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
  }, [user?.id]); // ← solo al cambiar el user ID, no en cada render

  // Sync manual (botón "↕ Sync" en AccountSection)
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

  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 820);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Sync view when tweak changes from panel
  React.useEffect(() => { if (t.defaultView && t.defaultView !== view) setView(t.defaultView); }, [t.defaultView]);

  // keyboard: / focus search, N new
  React.useEffect(() => {
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

  const filtered = React.useMemo(() => {
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

    // Sorting logic for library
    items.sort((a, b) => {
      let vA, vB;
      if (libSort === "alpha") {
        vA = (a.title || "").toLowerCase();
        vB = (b.title || "").toLowerCase();
      } else if (libSort === "uses") {
        vA = a.uses || 0;
        vB = b.uses || 0;
      } else {
        // Default: recent (updated_at)
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
  React.useEffect(() => {
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

  // ── Bulk selection helpers ──────────────────────────────────────────────────
  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  // ids = array of ids to set; clear = true removes all instead
  const selectAllVisible = (ids, clear = false) =>
    setSelectedIds(clear ? new Set() : new Set(ids));
  const clearSelection = () => setSelectedIds(new Set());
  // Pide confirmación antes de borrar
  const requestBulkDelete = () => setConfirmBulk(true);
  const bulkDelete = async () => {
    const count = selectedIds.size;
    // Captura los IDs en este momento para que el filter no dependa del closure
    const ids = new Set(selectedIds);
    setPrompts(ps => ps.filter(p => !ids.has(p.id)));
    setSelectedIds(new Set());
    setConfirmBulk(false);
    showToast(`Deleted ${count} prompt${count !== 1 ? "s" : ""}`, "ok");
    if (user && _supabase) {
      await _supabase.from('prompts').delete()
        .in('id', [...ids]).eq('user_id', user.id);
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
    draft: {
      title: "",
      body: "",
      ai: filter.ai || "claude",
      tags: [...(filter.tags || [])],
      star: filter.scope === "starred"
    }
  });
  const openEdit = (p) => setEditor({ open: true, draft: { ...p } });
  const saveDraft = async () => {
    const d = editor.draft;
    if (!d.title.trim()) { showToast("Add a title first"); return; }

    // Calcular creator_name ahora para guardarlo local Y remotamente
    const creatorName = d.public && user
      ? (user.user_metadata?.full_name || user.user_metadata?.name || user.email)
      : (d.creator_name || null);

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

    // Push inmediato a Supabase si el usuario está logueado
    pushPromptToCloud(savedPrompt);
  };
  // ── Guardar copia de un prompt comunitario ────────────────────────────────
  const saveFromCommunity = (communityPrompt) => {
    if (!user) { showToast("Sign in to save prompts", "error"); return; }

    // Dedup: ¿Es un prompt que vos mismo subiste?
    if (communityPrompt.user_id === user.id) {
      showToast("Este prompt ya es tuyo 👆", "error");
      return;
    }

    // Dedup: ¿Ya tenés una copia guardada (por ID directo o por source_id)?
    const alreadySaved = prompts.some(
      p => p.id === communityPrompt.id || p.source_id === communityPrompt.id
    );
    if (alreadySaved) {
      showToast("Ya tenés este prompt guardado", "error");
      return;
    }

    const { user_id, creator_name, creator_verified, saves: _saves, public: _pub, ...rest } = communityPrompt;
    const now = new Date().toISOString();
    const copy = {
      ...rest,
      id: crypto.randomUUID(),
      source_id: communityPrompt.id,   // rastrea el prompt original para dedup futuro
      star: false,
      uses: 0,
      edited: "just now",
      updated_at: now,
      public: false,
    };
    setPrompts(ps => [copy, ...ps]);
    showToast("Saved to your library ✓", "ok");

    if (_supabase && user) {
      // 1. Persistir la copia inmediatamente en Supabase
      pushPromptToCloud(copy);

      // 2. Incrementar el contador de saves del prompt original
      _supabase
        .rpc('increment_prompt_saves', { prompt_id: communityPrompt.id })
        .then(({ error }) => {
          if (error) console.warn('[Stash] increment_prompt_saves falló:', error.message);
        });
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

  // ── Layout ────────────────────────────────────────────────────────────────
  const showDetailPane = view === "list" && !isMobile;
  const showMobileDetail = isMobile && mobileDetail && sel;

  const accountProps = {
    user,
    loading:   authState.loading,
    syncing:   authState.syncing,
    lastSync:  authState.lastSync,
    syncError: authState.syncError,
    signIn,
    signOut,
    onSync:    handleManualSync,
  };

  const onTagClick = (t) => {
    setSection("library");
    const tags = filter.tags || [];
    const nextTags = tags.includes(t)
      ? tags.filter(tag => tag !== t)
      : [...tags, t];
    setFilter({ ...filter, tags: nextTags });
  };

  return (
    <div style={{
      height: "100dvh", display: "flex", flexDirection: "column",
      background: "var(--bg)", color: "var(--text)",
      fontFamily: "'Geist', system-ui, -apple-system, 'Segoe UI', sans-serif",
      fontSize: 14,
    }}>
      <TopBar q={q} setQ={setQ} view={view} setView={setView} onNew={openNew}
        accent={accent} accentInk={accentInk}
        onMenu={() => setMobileSidebar(true)} isMobile={isMobile}
        dark={!!t.dark} onToggleDark={() => setTweak("dark", !t.dark)}
        section={section}
        libSort={libSort} setLibSort={setLibSort}
        libDir={libDir} setLibDir={setLibDir}
      />

      <div style={{ flex: 1, display: "flex", minHeight: 0, position: "relative" }}>
        {/* sidebar (desktop static, mobile drawer) */}
        {!isMobile && (
          <Sidebar prompts={prompts} filter={filter} setFilter={setFilter} accent={accent} accentSoft={accentSoft} accountProps={accountProps} section={section} setSection={setSection} />
        )}
        {isMobile && mobileSidebar && (
          <div onClick={() => setMobileSidebar(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,22,18,.3)", zIndex: 100, animation: "stashFadeIn .15s ease-out" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 0, left: 0, bottom: 0, animation: "slideInLeft .2s cubic-bezier(.2,.7,.3,1)" }}>
              <Sidebar prompts={prompts} filter={filter} setFilter={(f) => { setFilter(f); setMobileSidebar(false); }} accent={accent} accentSoft={accentSoft} accountProps={accountProps} section={section} setSection={(s) => { setSection(s); setMobileSidebar(false); }} />
            </div>
          </div>
        )}

        {/* center */}
        <main ref={mainRef} style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: view === "list" ? "var(--surface)" : "var(--bg)" }}>
          {section === "library" && (
            <BulkBar
              count={selectedIds.size}
              total={filtered.length}
              onSelectAll={() => selectAllVisible(filtered.map(p => p.id))}
              onClear={clearSelection}
              onDelete={requestBulkDelete}
            />
          )}
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {section === "explore" ? (
            <ExploreView
              accent={accent}
              accentSoft={accentSoft}
              accentInk={accentInk}
              user={user}
              onSave={saveFromCommunity}
              showToast={showToast}
              view={view}
              density={t.density}
            />
          ) : view === "list" ? (
            <ListView
              prompts={filtered}
              selId={sel?.id}
              setSel={(id) => { setSel(id); if (isMobile) setMobileDetail(true); }}
              toggleStar={toggleStar}
              accent={accent}
              density={t.density}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onSelectAllVisible={selectAllVisible}
              onTagClick={onTagClick}
              activeTags={filter.tags}
            />
          ) : (
            <GridView
              prompts={filtered}
              setSel={(id) => { setSel(id); if (isMobile) setMobileDetail(true); else setPreviewId(id); }}
              toggleStar={toggleStar}
              accent={accent}
              density={t.density}
              onCopy={onCopy}
              onEdit={openEdit}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onTagClick={onTagClick}
              activeTags={filter.tags}
            />
          )}

          {/* resize handle + detail pane (list view, desktop) */}
          {section === "library" && showDetailPane && (
            <React.Fragment>
              <Splitter
                accent={accent}
                onDrag={(clientX) => {
                  if (clientX === null) {
                    setDetailWidth(380);
                    try { localStorage.setItem("stash:detailWidth", "380"); } catch (e) {}
                    return;
                  }
                  const r = mainRef.current?.getBoundingClientRect();
                  if (!r) return;
                  // detail width = right edge of main - cursor x, clamped
                  const minW = 280;
                  const maxW = Math.min(720, r.width - 320); // leave space for list
                  const w = Math.max(minW, Math.min(maxW, r.right - clientX));
                  setDetailWidth(w);
                  try { localStorage.setItem("stash:detailWidth", String(Math.round(w))); } catch (e) {}
                }}
              />
              <Detail
                p={sel} accent={accent} accentSoft={accentSoft}
                toggleStar={toggleStar}
                onCopy={onCopy} onEdit={openEdit} onDelete={onDelete} onUnpublish={onUnpublish}
                isMobile={false}
                width={detailWidth}
                onTagClick={onTagClick}
                activeTags={filter.tags}
              />
            </React.Fragment>
          )}
          </div>{/* end flex row inside main */}
        </main>

        {/* mobile detail overlay */}
        {showMobileDetail && (
          <div style={{ position: "absolute", inset: 0, background: "var(--bg)", zIndex: 90, display: "flex", flexDirection: "column", animation: "slideInRight .2s cubic-bezier(.2,.7,.3,1)" }}>
            <Detail
              p={sel} accent={accent} accentSoft={accentSoft}
              toggleStar={toggleStar}
              onCopy={onCopy} onEdit={openEdit} onDelete={(id) => { onDelete(id); setMobileDetail(false); }} onUnpublish={onUnpublish}
              isMobile={true}
              onClose={() => setMobileDetail(false)}
              onTagClick={onTagClick}
              activeTags={filter.tags}
            />
          </div>
        )}
      </div>

      <Editor
        open={editor.open} draft={editor.draft}
        setDraft={(d) => setEditor({ ...editor, draft: d })}
        onSave={saveDraft} onClose={() => setEditor({ open: false, draft: null })}
        accent={accent} accentInk={accentInk} user={user}
      />
      <VarFiller
        open={filler.open} prompt={filler.prompt}
        onClose={() => setFiller({ open: false, prompt: null })}
        onConfirm={onFillerConfirm}
        accent={accent} accentInk={accentInk}
      />
      <PromptPreview
        open={previewId !== null && !isMobile}
        prompt={filtered.find(p => p.id === previewId)}
        onClose={() => setPreviewId(null)}
        accent={accent} accentSoft={accentSoft} accentInk={accentInk}
        toggleStar={toggleStar}
        onCopy={onCopy}
        onEdit={(p) => { setPreviewId(null); openEdit(p); }}
        onDelete={(id) => { onDelete(id); setPreviewId(null); }}
        onUnpublish={onUnpublish}
        onPrev={() => {
          const i = filtered.findIndex(p => p.id === previewId);
          if (i > 0) { setPreviewId(filtered[i - 1].id); setSel(filtered[i - 1].id); }
        }}
        onNext={() => {
          const i = filtered.findIndex(p => p.id === previewId);
          if (i >= 0 && i < filtered.length - 1) { setPreviewId(filtered[i + 1].id); setSel(filtered[i + 1].id); }
        }}
        hasPrev={(() => { const i = filtered.findIndex(p => p.id === previewId); return i > 0; })()}
        hasNext={(() => { const i = filtered.findIndex(p => p.id === previewId); return i >= 0 && i < filtered.length - 1; })()}
      />

      <ConfirmDeleteModal
        open={confirmBulk}
        count={selectedIds.size}
        onConfirm={bulkDelete}
        onCancel={() => setConfirmBulk(false)}
      />

      {toast}

      <TweaksPanel>
        <TweakSection label="Appearance" />
        <TweakToggle label="Dark mode" value={!!t.dark}
          onChange={(v) => setTweak("dark", v)} />
        <TweakColor
          label="Accent"
          value={t.theme}
          options={["amber", "citrus", "rose", "indigo"].map(k => THEMES[k].accent)}
          onChange={(v) => {
            const k = Object.keys(THEMES).find(k => THEMES[k].accent === v) || "amber";
            setTweak("theme", k);
          }}
        />
        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={t.density}
          options={["compact", "regular", "spacious"]}
          onChange={(v) => setTweak("density", v)} />
        <TweakRadio label="Default view" value={t.defaultView}
          options={["list", "grid"]}
          onChange={(v) => { setTweak("defaultView", v); setView(v); }} />
      </TweaksPanel>
    </div>
  );
}

// extra mobile keyframes
if (typeof document !== "undefined" && !document.getElementById("stash-anim-mobile")) {
  const s = document.createElement("style");
  s.id = "stash-anim-mobile";
  s.textContent = `
    @keyframes slideInLeft{from{transform:translateX(-100%)}to{transform:translateX(0)}}
    @keyframes slideInRight{from{transform:translateX(8%);opacity:0}to{transform:translateX(0);opacity:1}}
    @keyframes stashSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  `;
  document.head.appendChild(s);
}

window.StashApp = App;
