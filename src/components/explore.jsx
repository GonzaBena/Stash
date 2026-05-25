import React from 'react';
import { AIBadge, Tag, Modal, Btn, extractVars, renderBody, DENSITY } from '@/ui';
import { AI_META } from '@/data';
import { _supabase } from '@/supabase';
import { SearchIcon } from './icons';

export const SaveIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);

export const VerifiedBadge = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#0ea5e9" title="Verified creator" style={{ flexShrink: 0 }}>
    <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82 1.89 3.2L12 21.04l3.4 1.47 1.89-3.2 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/>
  </svg>
);

export function CommunityCard({ p, accent, user, onSave, onCardClick, onCreatorClick }) {
  const m = AI_META[p.ai] || AI_META.generic;
  const vars = extractVars(p.body || "");
  return (
    <div
      className="stash-card"
      onClick={onCardClick}
      style={{
        background: "var(--surface)", borderRadius: 14, padding: 16,
        border: "1px solid var(--border)",
        cursor: "pointer", display: "flex", flexDirection: "column", gap: 8,
        minHeight: 160, position: "relative", overflow: "hidden",
      }}
    >
      {/* model color stripe */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: m.color }} />

      {/* top row: AI badge + var count */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
        <AIBadge ai={p.ai} size="sm" />
        {vars.length > 0 && (
          <span style={{ fontSize: 11, color: accent, fontFamily: "ui-monospace, monospace", padding: "1px 7px", borderRadius: 999, background: `${accent}1f`, fontWeight: 600 }}>
            {`{{${vars.length}}}`}
          </span>
        )}
      </div>

      {/* title */}
      <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.25, color: "var(--text)" }}>
        {p.title}
      </div>

      {/* body preview */}
      <div style={{
        fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.5, flex: 1,
        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {(p.body || "").split("\n")[0]}
      </div>

      {/* tags */}
      {(p.tags || []).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {p.tags.map(t => <Tag key={t} size="sm">{t}</Tag>)}
        </div>
      )}

      {/* footer: creator + saves + save btn */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 6, borderTop: "1px dashed var(--border)", marginTop: 2 }}>
        <button
          onClick={e => { e.stopPropagation(); if (onCreatorClick) onCreatorClick(p); }}
          title={onCreatorClick ? `View ${p.creator_name || "Anonymous"}'s prompts` : undefined}
          style={{
            background: "none", border: "none", padding: 0,
            cursor: onCreatorClick ? "pointer" : "default",
            display: "flex", alignItems: "center", gap: 4,
            flex: 1, minWidth: 0, fontFamily: "inherit",
          }}
        >
          <span style={{
            fontSize: 11.5,
            color: onCreatorClick ? "var(--text-2)" : "var(--text-faint)",
            fontWeight: onCreatorClick ? 500 : 400,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {p.creator_name || "Anonymous"}
          </span>
          {p.creator_verified && <VerifiedBadge />}
          {p.saves > 0 && (
            <span style={{ fontSize: 11, color: "var(--text-faint)", flexShrink: 0 }}>
              · {p.saves} {p.saves === 1 ? "save" : "saves"}
            </span>
          )}
        </button>
        <button
          className="stash-iconbtn"
          title={user ? "Save to Library" : "Sign in to save"}
          style={{ flexShrink: 0, color: accent }}
          onClick={e => { e.stopPropagation(); onSave(p); }}
        >
          <SaveIcon />
        </button>
      </div>
    </div>
  );
}

export function CommunityRow({ p, accent, user, onSave, onCardClick, onCreatorClick, density }) {
  const d = DENSITY[density] || DENSITY.regular;
  const vars = extractVars(p.body || "");
  return (
    <div onClick={onCardClick} className="stash-row" style={{
      display: "grid", gridTemplateColumns: "32px 1fr 140px 100px 40px",
      gap: 12, alignItems: "center",
      padding: `${d.row}px 18px`,
      borderBottom: "1px solid var(--border-soft)",
      cursor: "pointer",
    }}>
      <AIBadge ai={p.ai} size="sm" showName={false} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: d.font + 0.5, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
        <div style={{ display: "flex", gap: 5, marginTop: 3, flexWrap: "wrap" }}>
          {p.tags.slice(0, 3).map(t => <Tag key={t} size="sm">{t}</Tag>)}
          {vars.length > 0 && (
            <span style={{ fontSize: 11, color: accent, fontFamily: "ui-monospace, monospace", padding: "1px 6px", borderRadius: 999, background: `${accent}1f`, fontWeight: 600 }}>
              {`{{${vars.length}}}`}
            </span>
          )}
        </div>
      </div>
      <button
          onClick={e => { e.stopPropagation(); if (onCreatorClick) onCreatorClick(p); }}
          style={{
            background: "none", border: "none", padding: 0,
            cursor: onCreatorClick ? "pointer" : "default",
            display: "flex", alignItems: "center", gap: 4,
            minWidth: 0, fontFamily: "inherit",
          }}
        >
          <span style={{
            fontSize: 12, color: "var(--text-2)", fontWeight: 500,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {p.creator_name || "Anonymous"}
          </span>
          {p.creator_verified && <VerifiedBadge />}
      </button>
      <div style={{ fontSize: 12, color: "var(--text-faint)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {p.uses}× · {p.saves}❤
      </div>
      <button
        className="stash-iconbtn"
        title={user ? "Save to Library" : "Sign in to save"}
        style={{ color: accent, marginLeft: "auto" }}
        onClick={e => { e.stopPropagation(); onSave(p); }}
      >
        <SaveIcon />
      </button>
    </div>
  );
}

export function ExplorePreview({ open, prompt, onClose, accent, accentSoft, accentInk, user, onSave, onViewProfile }) {
  if (!open || !prompt) return null;
  const vars = extractVars(prompt.body || "");
  const m = AI_META[prompt.ai] || AI_META.generic;

  return (
    <Modal open={open} onClose={onClose} width={680}>
      {/* model color stripe */}
      <div style={{ height: 4, background: m.color, flexShrink: 0 }} />

      {/* header */}
      <div style={{ padding: "20px 26px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, fontWeight: 500, color: "var(--text)", lineHeight: 1.15 }}>
            {prompt.title}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 8 }}>
            <AIBadge ai={prompt.ai} size="sm" />
            {(prompt.tags || []).length > 0 && (
              <span style={{ width: 1, height: 14, background: "var(--border)", margin: "0 2px" }} />
            )}
            {(prompt.tags || []).map(t => <Tag key={t} size="sm">{t}</Tag>)}
          </div>
          {/* creator meta */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-faint)", marginTop: 8 }}>
            <span>by</span>
            {onViewProfile ? (
              <button
                onClick={() => { onViewProfile(prompt); onClose(); }}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12, color: "var(--text-2)", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}
              >
                {prompt.creator_name || "Anonymous"}
                {prompt.creator_verified && <VerifiedBadge />}
              </button>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: 3, color: "var(--text-2)", fontWeight: 600 }}>
                {prompt.creator_name || "Anonymous"}
                {prompt.creator_verified && <VerifiedBadge />}
              </span>
            )}
            {(prompt.uses > 0 || prompt.saves > 0) && (
              <span>·
                {prompt.uses > 0 ? ` ${prompt.uses}× used` : ""}
                {prompt.saves > 0 ? ` · ${prompt.saves} ${prompt.saves === 1 ? "save" : "saves"}` : ""}
              </span>
            )}
          </div>
        </div>
        <button className="stash-iconbtn" onClick={onClose} title="Close (Esc)" style={{ flexShrink: 0 }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>×</span>
        </button>
      </div>

      {/* body */}
      <div style={{ padding: 22, flex: 1, minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <pre style={{
          margin: 0, fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 13.5, lineHeight: 1.65,
          whiteSpace: "pre-wrap", wordBreak: "break-word", color: "var(--text)",
          background: "var(--surface)", padding: 18, borderRadius: 12, border: "1px solid var(--border)",
        }}>{renderBody(prompt.body || "", accent)}</pre>

        {vars.length > 0 && (
          <div style={{ padding: 14, background: accentSoft, borderRadius: 12 }}>
            <div style={{ fontSize: 11, letterSpacing: 0.7, textTransform: "uppercase", fontWeight: 600, color: "var(--text-3)", marginBottom: 8 }}>
              {vars.length} variable{vars.length !== 1 ? "s" : ""}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {vars.map(v => (
                <span key={v} style={{ background: "var(--surface)", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontFamily: "ui-monospace, monospace", color: accent, fontWeight: 600, border: `1px solid ${accent}33` }}>
                  {`{{${v}}}`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* footer */}
      <div style={{ padding: "12px 22px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center", flexShrink: 0 }}>
        {!user && (
          <span style={{ fontSize: 12, color: "var(--text-faint)", marginRight: 4 }}>Sign in to save</span>
        )}
        <Btn onClick={onClose}>Close</Btn>
        <Btn primary accent={accent} accentInk={accentInk}
          onClick={() => onSave(prompt)}
          title={user ? "Save a copy to your library" : "Sign in to save prompts"}
          style={{ opacity: user ? 1 : 0.5 }}
        >
          <SaveIcon /> Save to Library
        </Btn>
      </div>
    </Modal>
  );
}

export function UserProfile({ userId, creatorName, creatorVerified, accent, accentSoft, accentInk, user, onSave, onBack }) {
  const [prompts, setPrompts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error,   setError]   = React.useState(null);
  const [preview, setPreview] = React.useState(null);

  React.useEffect(() => {
    if (!_supabase) { setLoading(false); return; }
    setLoading(true);
    _supabase
      .from('prompts')
      .select('id, title, body, ai, tags, uses, saves, creator_name, creator_verified, user_id, updated_at')
      .eq('user_id', userId)
      .eq('public', true)
      .order('uses', { ascending: false })
      .then(({ data, error: fetchErr }) => {
        if (fetchErr) setError(fetchErr.message);
        else setPrompts(data || []);
        setLoading(false);
      });
  }, [userId]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", background: "var(--bg)" }}>
      {/* profile header */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onBack}
          className="stash-iconbtn"
          title="Back to Explore"
          style={{ flexShrink: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
          {(creatorName || "?")[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, fontWeight: 500, color: "var(--text)" }}>
              {creatorName || "Anonymous"}
            </span>
            {creatorVerified && <VerifiedBadge />}
          </div>
          {!loading && (
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 1 }}>
              {prompts.length} public prompt{prompts.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* grid */}
      <div style={{ flex: 1, overflow: "auto", padding: 18 }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--text-faint)", fontSize: 13.5 }}>
            Loading prompts…
          </div>
        ) : error ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--danger)", fontSize: 13.5 }}>{error}</div>
        ) : prompts.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--text-faint)" }}>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 22, color: "var(--text-2)", marginBottom: 6 }}>
              No public prompts yet
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {prompts.map(p => (
              <CommunityCard
                key={p.id}
                p={p}
                accent={accent}
                user={user}
                onSave={onSave}
                onCardClick={() => setPreview(p)}
                onCreatorClick={null}
              />
            ))}
          </div>
        )}
      </div>

      <ExplorePreview
        open={!!preview}
        prompt={preview}
        onClose={() => setPreview(null)}
        accent={accent}
        accentSoft={accentSoft}
        accentInk={accentInk}
        user={user}
        onSave={p => { onSave(p); setPreview(null); }}
        onViewProfile={null}
      />
    </div>
  );
}

export function ExploreView({ accent, accentSoft, accentInk, user, onSave, showToast, view = "grid", density = "regular" }) {
  const [results,       setResults]       = React.useState(() => {
    try {
      const cached = localStorage.getItem('stash:explore_cache');
      return cached ? JSON.parse(cached) : [];
    } catch (e) { return []; }
  });
  const [loading,       setLoading]       = React.useState(results.length === 0);
  const [error,         setError]         = React.useState(null);
  const [q,             setQ]             = React.useState("");
  const [aiFilter,      setAiFilter]      = React.useState(null);
  const [sort,          setSort]          = React.useState("popular");
  const [preview,       setPreview]       = React.useState(null);
  const [profileTarget, setProfileTarget] = React.useState(null);
  const [refreshKey,    setRefreshKey]    = React.useState(0);

  const orderMap = {
    popular: { column: "uses",       ascending: false },
    saved:   { column: "saves",      ascending: false },
    recent:  { column: "updated_at", ascending: false },
  };

  React.useEffect(() => {
    if (!_supabase) { setLoading(false); return; }
    // Solo mostramos loading si no hay resultados previos
    if (results.length === 0) setLoading(true);
    setError(null);
    _supabase
      .from('prompts')
      .select('id, title, body, ai, tags, uses, saves, creator_name, creator_verified, user_id, updated_at')
      .eq('public', true)
      .then(({ data, error: fetchErr }) => {
        if (fetchErr) setError(fetchErr.message);
        else {
          const fetched = data || [];
          setResults(fetched);
          try { localStorage.setItem('stash:explore_cache', JSON.stringify(fetched)); } catch (e) {}
        }
        setLoading(false);
      });
  }, [refreshKey]);

  const filtered = React.useMemo(() => {
    // 1. Filtrar
    let items = results.filter(p => {
      if (aiFilter && p.ai !== aiFilter) return false;
      if (q) {
        const ql = q.toLowerCase();
        const hay = (p.title + " " + (p.body || "") + " " + (p.tags || []).join(" ")).toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });

    // 2. Ordenar localmente
    const { column, ascending } = orderMap[sort] || orderMap.popular;
    items.sort((a, b) => {
      let vA = a[column];
      let vB = b[column];
      if (column === "updated_at") {
        vA = new Date(vA || 0).getTime();
        vB = new Date(vB || 0).getTime();
      }
      if (vA === vB) return 0;
      const res = vA > vB ? 1 : -1;
      return ascending ? res : -res;
    });

    return items;
  }, [results, q, aiFilter, sort]);

  const handleViewProfile = (p) => {
    setProfileTarget({ userId: p.user_id, creatorName: p.creator_name, creatorVerified: p.creator_verified });
  };

  // ── Sin Supabase ──────────────────────────────────────────────────────────
  if (!_supabase) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 40, color: "var(--text-faint)" }}>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 24, color: "var(--text-2)" }}>Cloud not configured</div>
        <div style={{ fontSize: 13.5, textAlign: "center", maxWidth: 360, lineHeight: 1.6 }}>
          Add your Supabase credentials to{" "}
          <code style={{ background: "var(--surface)", padding: "1px 6px", borderRadius: 4, border: "1px solid var(--border)", fontSize: 12 }}>src/config.jsx</code>{" "}
          to explore community prompts.
        </div>
      </div>
    );
  }

  // ── Perfil de usuario (sub-navegación) ────────────────────────────────────
  if (profileTarget) {
    return (
      <UserProfile
        userId={profileTarget.userId}
        creatorName={profileTarget.creatorName}
        creatorVerified={profileTarget.creatorVerified}
        accent={accent}
        accentSoft={accentSoft}
        accentInk={accentInk}
        user={user}
        onSave={onSave}
        onBack={() => setProfileTarget(null)}
      />
    );
  }

  const sortLabels = { popular: "Popular", saved: "Most Saved", recent: "Recent" };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", background: "var(--bg)" }}>

      {/* ── Barra de filtros ─────────────────────────────────────────────── */}

      {/* Fila 1: buscador */}
      <div style={{ flexShrink: 0, padding: "12px 14px 8px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 12px" }}>
          <span style={{ color: "var(--text-faint)", display: "flex" }}><SearchIcon /></span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search community prompts…"
            style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontFamily: "inherit", fontSize: 13.5, color: "var(--text)" }}
          />
          {q && (
            <button className="stash-iconbtn" onClick={() => setQ("")} style={{ width: 22, height: 22 }}>
              <span style={{ fontSize: 14 }}>×</span>
            </button>
          )}
        </div>
      </div>

      {/* Fila 2: chips AI — scroll horizontal sin wrap */}
      <div style={{
        flexShrink: 0,
        display: "flex", gap: 6, padding: "8px 14px",
        overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
        borderBottom: "1px solid var(--border)",
      }}>
        <button onClick={() => setAiFilter(null)} style={chipStyle(aiFilter === null, accent, "#fff")}>
          All
          {!loading && <span style={{ opacity: .55, fontSize: 11, fontWeight: 400, marginLeft: 2 }}>{results.length}</span>}
        </button>
        {Object.entries(AI_META).map(([k, m]) => {
          const count = results.filter(p => p.ai === k).length;
          if (!loading && count === 0) return null;
          return (
            <button key={k} onClick={() => setAiFilter(aiFilter === k ? null : k)} style={chipStyle(aiFilter === k, m.color, "#fff")}>
              <span style={{ fontWeight: 700 }}>{m.glyph}</span> {m.name}
              {!loading && <span style={{ opacity: .55, fontSize: 11, fontWeight: 400, marginLeft: 2 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Fila 3: sort + contador + recarga */}
      <div style={{
        flexShrink: 0,
        display: "flex", alignItems: "center", gap: 4,
        padding: "6px 14px 7px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-soft)",
      }}>
        {/* contador */}
        <span style={{ fontSize: 11.5, color: "var(--text-faint)", flexShrink: 0 }}>
          {loading ? "…" : `${filtered.length} prompt${filtered.length !== 1 ? "s" : ""}`}
        </span>

        <span style={{ flex: 1 }} />

        {/* sort buttons */}
        {Object.keys(sortLabels).map(s => (
          <button key={s} onClick={() => setSort(s)} style={{
            padding: "4px 11px", borderRadius: 20, fontSize: 12, fontWeight: sort === s ? 600 : 500,
            background: sort === s ? "var(--surface)" : "transparent",
            color: sort === s ? "var(--text)" : "var(--text-faint)",
            border: `1px solid ${sort === s ? "var(--border)" : "transparent"}`,
            cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
            transition: "background .1s",
          }}>
            {sortLabels[s]}
          </button>
        ))}

        {/* Refresh */}
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          disabled={loading}
          title="Reload"
          style={{
            marginLeft: 2, flexShrink: 0, width: 28, height: 28,
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 7, border: "1px solid var(--border)",
            background: "var(--surface)", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.4 : 1, transition: "opacity .15s",
            color: "var(--text-2)",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"
            style={{ display: "block", animation: loading ? "stashSpin .7s linear infinite" : "none" }}>
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>

      {/* ── Contenido ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "auto", padding: view === "grid" ? 18 : 0, background: view === "list" ? "var(--surface)" : "var(--bg)" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--text-faint)", fontSize: 13.5 }}>
            Loading community prompts…
          </div>
        ) : error ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--danger)", fontSize: 13.5 }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--text-faint)" }}>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 24, color: "var(--text-2)", marginBottom: 8 }}>
              {results.length === 0 ? "No public prompts yet" : "No results"}
            </div>
            <div style={{ fontSize: 13.5 }}>
              {results.length === 0
                ? 'Be the first! Toggle "Share publicly" when editing a prompt.'
                : "Try a different search or remove a filter."}
            </div>
          </div>
        ) : view === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {filtered.map(p => (
              <CommunityCard
                key={p.id}
                p={p}
                accent={accent}
                user={user}
                onSave={onSave}
                onCardClick={() => setPreview(p)}
                onCreatorClick={handleViewProfile}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* List Header */}
            <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 140px 100px 40px", padding: "10px 18px 8px", alignItems: "center", fontSize: 11, color: "var(--text-faint)", letterSpacing: 0.7, textTransform: "uppercase", fontWeight: 600, borderBottom: "1px solid var(--border)", gap: 12, position: "sticky", top: 0, background: "var(--surface)", zIndex: 10 }}>
              <span>Model</span>
              <span>Title</span>
              <span>Creator</span>
              <span style={{ textAlign: "right" }}>Stats</span>
              <span />
            </div>
            {filtered.map(p => (
              <CommunityRow
                key={p.id}
                p={p}
                accent={accent}
                user={user}
                onSave={onSave}
                onCardClick={() => setPreview(p)}
                onCreatorClick={handleViewProfile}
                density={density}
              />
            ))}
          </div>
        )}
      </div>

      {/* preview modal */}
      <ExplorePreview
        open={!!preview}
        prompt={preview}
        onClose={() => setPreview(null)}
        accent={accent}
        accentSoft={accentSoft}
        accentInk={accentInk}
        user={user}
        onSave={p => { onSave(p); setPreview(null); }}
        onViewProfile={handleViewProfile}
      />
    </div>
  );
}

// helper para estilos de chips de filtro
function chipStyle(active, color, inkColor) {
  return {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "5px 12px", borderRadius: 20, fontSize: 12.5, fontWeight: active ? 600 : 500,
    background: active ? color : "var(--surface)",
    color: active ? (inkColor || "#fff") : "var(--text-2)",
    border: `1px solid ${active ? color : "var(--border)"}`,
    cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
    transition: "background .1s, color .1s",
  };
}
