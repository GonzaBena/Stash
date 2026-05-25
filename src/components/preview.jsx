// src/components/preview.jsx — PromptPreview modal (grid view card click)

function PromptPreview({ open, prompt, onClose, accent, accentSoft, accentInk, toggleStar, onCopy, onEdit, onDelete, onUnpublish, onPrev, onNext, hasPrev, hasNext }) {
  if (!open || !prompt) return null;
  const vars = extractVars(prompt.body);
  const m = AI_META[prompt.ai];

  // arrow-key nav between prompts while preview is open
  React.useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "ArrowLeft" && hasPrev) { e.preventDefault(); onPrev(); }
      if (e.key === "ArrowRight" && hasNext) { e.preventDefault(); onNext(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasPrev, hasNext, onPrev, onNext]);

  return (
    <Modal open={open} onClose={onClose} width={720}>
      {/* model color stripe — matches the grid card */}
      <div style={{ height: 4, background: m.color, flexShrink: 0 }} />

      {/* header */}
      <div style={{ padding: "20px 26px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 12, flexShrink: 0 }}>
        <Star on={prompt.star} onClick={() => toggleStar(prompt.id)} accent={accent} size={22} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, fontWeight: 500, color: "var(--text)", lineHeight: 1.1 }}>{prompt.title}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 8 }}>
            <AIBadge ai={prompt.ai} size="sm" />
            <span style={{ width: 1, height: 14, background: "var(--border)", margin: "0 2px" }} />
            {prompt.tags.map(t => <Tag key={t} size="sm">{t}</Tag>)}
            <span style={{ marginLeft: 4, color: "var(--text-faint)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
              · {prompt.uses}× · edited {prompt.edited} ago
            </span>
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
        }}>{renderBody(prompt.body, accent)}</pre>

        {vars.length > 0 && (
          <div style={{ padding: 14, background: accentSoft, borderRadius: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, letterSpacing: 0.7, textTransform: "uppercase", fontWeight: 600, color: "var(--text-3)" }}>
                {vars.length} variable{vars.length !== 1 ? "s" : ""}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted-2)" }}>filled when you copy</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {vars.map(v => (
                <span key={v} style={{ background: "var(--surface)", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontFamily: "ui-monospace, monospace", color: accent, fontWeight: 600, border: `1px solid ${accent}33` }}>{`{{${v}}}`}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* footer */}
      <div style={{ padding: "12px 22px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
        {/* prev/next */}
        <button className="stash-iconbtn" disabled={!hasPrev} onClick={onPrev} title="Previous (←)"
          style={{ opacity: hasPrev ? 1 : 0.3, cursor: hasPrev ? "pointer" : "default" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button className="stash-iconbtn" disabled={!hasNext} onClick={onNext} title="Next (→)"
          style={{ opacity: hasNext ? 1 : 0.3, cursor: hasNext ? "pointer" : "default" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <div style={{ flex: 1 }} />
        {prompt.public && onUnpublish && (
          <Btn onClick={() => onUnpublish(prompt.id)} title="Quitar de Explore" style={{ color: "var(--text-2)" }}><EyeOffIcon /></Btn>
        )}
        <Btn onClick={() => onDelete(prompt.id)} title="Delete" style={{ color: "var(--danger)" }}><TrashIcon /></Btn>
        {!prompt.source_id && <Btn onClick={() => onEdit(prompt)}><EditIcon /> Edit</Btn>}
        <Btn primary accent={accent} accentInk={accentInk} onClick={() => onCopy(prompt)}><CopyIcon /> Copy</Btn>
      </div>
    </Modal>
  );
}

Object.assign(window, { PromptPreview });
