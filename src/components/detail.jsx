// src/components/detail.jsx — Detail pane (right of list view + mobile overlay)

function Detail({ p, accent, accentSoft, toggleStar, onCopy, onEdit, onDelete, onUnpublish, onClose, isMobile, width }) {
  if (!p) return (
    <div style={{ flex: isMobile ? 1 : `0 0 ${width || 380}px`, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-faint)", fontStyle: "italic", fontFamily: "'Instrument Serif', serif", fontSize: 22, padding: 40, textAlign: "center", background: "var(--bg)", borderLeft: isMobile ? 0 : "1px solid var(--border)" }}>
      Select a prompt to see its body
    </div>
  );
  const vars = extractVars(p.body);
  return (
    <div style={{ flex: isMobile ? "1" : `0 0 ${width || 380}px`, background: "var(--bg)", display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px 10px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border)" }}>
        <Star on={p.star} onClick={() => toggleStar(p.id)} accent={accent} size={18} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 500, color: "var(--text)", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted-2)", marginTop: 2 }}>edited {p.edited} ago · {p.uses} runs</div>
        </div>
        {isMobile && (
          <button className="stash-iconbtn" onClick={onClose} title="Close"><span style={{ fontSize: 18 }}>×</span></button>
        )}
      </div>
      <div style={{ padding: "10px 18px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", borderBottom: "1px solid var(--border)" }}>
        <AIBadge ai={p.ai} size="sm" />
        <span style={{ width: 1, height: 14, background: "var(--border)", margin: "0 2px" }} />
        {p.tags.map(t => <Tag key={t} size="sm">{t}</Tag>)}
      </div>
      <div style={{ padding: 18, flex: 1, overflow: "auto" }}>
        <pre style={{
          margin: 0, fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 13, lineHeight: 1.6,
          whiteSpace: "pre-wrap", wordBreak: "break-word", color: "var(--text)",
          background: "var(--surface)", padding: 14, borderRadius: 12, border: "1px solid var(--border)",
        }}>{renderBody(p.body, accent)}</pre>
        {vars.length > 0 && (
          <div style={{ marginTop: 14, padding: 12, background: accentSoft, borderRadius: 12 }}>
            <div style={{ fontSize: 11, letterSpacing: 0.7, textTransform: "uppercase", fontWeight: 600, color: "var(--text-3)", marginBottom: 6 }}>{vars.length} variable{vars.length !== 1 ? "s" : ""}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {vars.map(v => (
                <span key={v} style={{ background: "var(--surface)", padding: "3px 9px", borderRadius: 999, fontSize: 12, fontFamily: "ui-monospace, monospace", color: accent, fontWeight: 600, border: `1px solid ${accent}33` }}>{`{{${v}}}`}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: 14, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
        <Btn onClick={() => onCopy(p)} style={{ flex: 1, justifyContent: "center" }}><CopyIcon /> Copy</Btn>
        <Btn onClick={() => onEdit(p)} style={{ justifyContent: "center" }}><EditIcon /> Edit</Btn>
        {p.public && onUnpublish && (
          <Btn onClick={() => onUnpublish(p.id)} title="Quitar de Explore" style={{ color: "var(--text-2)" }}><EyeOffIcon /></Btn>
        )}
        <Btn onClick={() => onDelete(p.id)} title="Delete" style={{ color: "var(--danger)" }}><TrashIcon /></Btn>
      </div>
    </div>
  );
}

Object.assign(window, { Detail });
