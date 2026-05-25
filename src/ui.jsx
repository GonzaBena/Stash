// src/ui.jsx — shared UI primitives + theme helpers for Stash

// ── Theme ───────────────────────────────────────────────────────────────────
const THEMES = {
  amber:   { accent: "#f2a23b", accentInk: "#3a2509", soft: "#fef3e0" },
  citrus:  { accent: "#a3c93a", accentInk: "#2c4309", soft: "#eef6d5" },
  rose:    { accent: "#ec5f7a", accentInk: "#ffffff", soft: "#fde2e8" },
  indigo:  { accent: "#6366f1", accentInk: "#ffffff", soft: "#e6e8ff" },
};

const DENSITY = {
  compact:  { row: 8,  card: 12, gap: 10, font: 13.5 },
  regular:  { row: 12, card: 16, gap: 14, font: 14 },
  spacious: { row: 16, card: 20, gap: 18, font: 15 },
};

// ── Tag chip ────────────────────────────────────────────────────────────────
function Tag({ children, on, onClick, size = "md" }) {
  const hue = TAG_HUES[children] || { bg: "var(--row-hover-2)", fg: "var(--text-2)" };
  const pad = size === "sm" ? "1px 7px" : "2px 9px";
  return (
    <span onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: pad, borderRadius: 999,
      background: on ? hue.fg : hue.bg,
      color: on ? "var(--surface)" : hue.fg,
      fontSize: size === "sm" ? 11 : 12, fontWeight: 500,
      cursor: onClick ? "pointer" : "default",
      letterSpacing: 0.1, whiteSpace: "nowrap",
      lineHeight: 1.5,
    }}>#{children}</span>
  );
}

// ── AI badge ────────────────────────────────────────────────────────────────
function AIBadge({ ai, size = "md", showName = true }) {
  const m = AI_META[ai];
  const dim = size === "sm" ? 14 : size === "lg" ? 22 : 18;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: size === "sm" ? 11.5 : 13, color: "var(--text-2)" }}>
      <span style={{
        width: dim, height: dim, borderRadius: "50%", background: m.color,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        color: "var(--surface)", fontSize: size === "sm" ? 9 : 11, fontWeight: 600,
        boxShadow: "inset 0 -1px 0 rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.25)",
      }}>{m.glyph}</span>
      {showName && <span style={{ fontWeight: 500 }}>{m.name}</span>}
    </span>
  );
}

// ── Star toggle ─────────────────────────────────────────────────────────────
function Star({ on, onClick, accent, size = 16 }) {
  return (
    <span onClick={(e) => { e.stopPropagation(); onClick && onClick(); }} style={{
      cursor: onClick ? "pointer" : "default", lineHeight: 1, fontSize: size,
      color: on ? accent : "transparent", textShadow: on ? "none" : "0 0 0 var(--text-faint)",
      transition: "transform .15s",
      display: "inline-block",
    }}>★</span>
  );
}

// ── Buttons ─────────────────────────────────────────────────────────────────
function Btn({ children, primary, ghost, accent, accentInk, onClick, style, title, size = "md" }) {
  const pad = size === "sm" ? "5px 10px" : size === "lg" ? "10px 18px" : "7px 14px";
  const fs = size === "sm" ? 12.5 : size === "lg" ? 15 : 13.5;
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: pad, borderRadius: 999, fontSize: fs, fontWeight: 500,
    cursor: "pointer", transition: "all .15s", border: "1px solid transparent",
    userSelect: "none", whiteSpace: "nowrap",
    fontFamily: "inherit",
  };
  let look;
  if (primary) {
    look = { background: accent, color: accentInk || "var(--surface)", boxShadow: `0 1px 0 rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.5)` };
  } else if (ghost) {
    look = { background: "transparent", color: "var(--text-2)" };
  } else {
    look = { background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border-strong)", boxShadow: "0 1px 0 rgba(0,0,0,.02)" };
  }
  return <button title={title} onClick={onClick} style={{ ...base, ...look, ...style }}>{children}</button>;
}

// ── Checkbox ─────────────────────────────────────────────────────────────────
function Checkbox({ checked, indeterminate, onChange, accent }) {
  return (
    <span onClick={(e) => { e.stopPropagation(); onChange(); }} style={{
      width: 16, height: 16, borderRadius: 4, flexShrink: 0, boxSizing: "border-box",
      border: `1.5px solid ${(checked || indeterminate) ? accent : "var(--border-strong)"}`,
      background: (checked || indeterminate) ? accent : "var(--surface)",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", transition: "all .12s",
    }}>
      {indeterminate && !checked
        ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="2" y1="5" x2="8" y2="5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
        : checked
          ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          : null}
    </span>
  );
}

// ── Label (form helper) ──────────────────────────────────────────────────────
function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6, letterSpacing: 0.2 }}>{children}</div>;
}

// ── Render body with {{var}} highlights ─────────────────────────────────────
function renderBody(text, accent) {
  return text.split(/(\{\{[^}]+\}\})/g).map((p, i) =>
    p.startsWith("{{")
      ? <span key={i} style={{
          background: `${accent}22`, color: accent,
          borderRadius: 4, padding: "0 4px", fontWeight: 600,
          fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: "0.9em",
        }}>{p.slice(2, -2)}</span>
      : <React.Fragment key={i}>{p}</React.Fragment>
  );
}

function extractVars(text) {
  const re = /\{\{([^}]+)\}\}/g;
  const out = [];
  const seen = new Set();
  let m;
  while ((m = re.exec(text))) {
    const k = m[1].trim();
    if (!seen.has(k)) { seen.add(k); out.push(k); }
  }
  return out;
}

// ── Toast ───────────────────────────────────────────────────────────────────
function useToast() {
  const [t, setT] = React.useState(null);
  const show = React.useCallback((msg, kind = "info") => {
    setT({ msg, kind, id: Date.now() });
    setTimeout(() => setT(null), 1800);
  }, []);
  const node = t ? (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      background: "var(--toast-bg)", color: "var(--toast-fg)",
      padding: "9px 16px", borderRadius: 999, fontSize: 13.5, fontWeight: 500,
      boxShadow: "0 10px 30px rgba(0,0,0,.25)",
      display: "flex", alignItems: "center", gap: 8, zIndex: 9999,
      animation: "stashToastIn .25s cubic-bezier(.2,.7,.3,1)",
    }}>
      <span>{t.kind === "ok" ? "✓" : "·"}</span>{t.msg}
    </div>
  ) : null;
  return [node, show];
}

// ── Modal wrapper ───────────────────────────────────────────────────────────
function Modal({ open, onClose, children, width = 520 }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(26,22,18,.34)",
      backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9000, padding: 20,
      animation: "stashFadeIn .15s ease-out",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--bg-soft)", borderRadius: 18, width: "100%", maxWidth: width,
        maxHeight: "calc(100vh - 40px)", display: "flex", flexDirection: "column",
        boxShadow: "0 30px 80px rgba(0,0,0,.3), 0 0 0 1px rgba(26,22,18,.06)",
        animation: "stashModalIn .2s cubic-bezier(.2,.7,.3,1)",
        overflow: "hidden",
      }}>{children}</div>
    </div>
  );
}

// inject keyframes once
if (typeof document !== "undefined" && !document.getElementById("stash-anim")) {
  const s = document.createElement("style");
  s.id = "stash-anim";
  s.textContent = `
    @keyframes stashFadeIn{from{opacity:0}to{opacity:1}}
    @keyframes stashModalIn{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
    @keyframes stashToastIn{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}
    .stash-row:hover{background:var(--row-hover)}
    .stash-card{transition:transform .18s cubic-bezier(.2,.7,.3,1), box-shadow .18s}
    .stash-card:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(var(--shadow-rgb),.12), 0 0 0 1px rgba(var(--shadow-rgb),.08)}
    .stash-iconbtn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;cursor:pointer;color:var(--text-muted);transition:all .12s;border:0;background:transparent}
    .stash-iconbtn:hover{background:var(--row-hover-2);color:var(--text)}
    .stash-iconbtn.on{background:var(--accent);color:#fff}
    .stash-link{color:var(--text-muted);cursor:pointer;font-size:13px}
    .stash-link:hover{color:var(--text)}
    .stash-input{font-family:inherit;font-size:14px;border:1px solid var(--border-strong);border-radius:10px;padding:9px 12px;background:var(--surface);color:var(--text);outline:none;transition:border-color .12s, box-shadow .12s}
    .stash-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
    .stash-textarea{font-family:ui-monospace,'SF Mono',monospace;font-size:13.5px;line-height:1.55;border:1px solid var(--border-strong);border-radius:12px;padding:12px 14px;background:var(--surface);color:var(--text);outline:none;resize:vertical;min-height:160px;transition:border-color .12s, box-shadow .12s}
    .stash-textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
    ::selection{background:var(--accent-soft);color:var(--text)}
  `;
  document.head.appendChild(s);
}

// ── Settings (gear) icon ────────────────────────────────────────────────────
function SettingsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06
               a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09
               A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83
               l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09
               A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83
               l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09
               a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83
               l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09
               a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

Object.assign(window, {
  THEMES, DENSITY,
  Tag, AIBadge, Star, Btn, Modal,
  Checkbox, Label,
  SettingsIcon,
  renderBody, extractVars, useToast,
});
