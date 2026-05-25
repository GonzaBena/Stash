// src/components/editor.jsx — Editor modal

function Editor({ open, draft, setDraft, onSave, onClose, accent, accentInk, user }) {
  if (!open || !draft) return null;
  const vars = extractVars(draft.body || "");
  return (
    <Modal open={open} onClose={onClose} width={620}>
      <div style={{ padding: "18px 22px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 24, color: "var(--text)" }}>
          {draft.id ? "Edit prompt" : "New prompt"}
        </span>
        <span style={{ marginLeft: "auto" }}>
          <button className="stash-iconbtn" onClick={onClose}><span style={{ fontSize: 20 }}>×</span></button>
        </span>
      </div>
      <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14, overflow: "auto" }}>
        <div>
          <Label>Title</Label>
          <input className="stash-input" autoFocus style={{ width: "100%", boxSizing: "border-box" }}
            value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="e.g. Blog post outline" />
        </div>
        <div>
          <Label>Model</Label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.entries(AI_META).map(([k, m]) => (
              <button key={k} onClick={() => setDraft({ ...draft, ai: k })} style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "6px 12px", borderRadius: 999, cursor: "pointer",
                background: draft.ai === k ? m.color : "var(--surface)",
                color: draft.ai === k ? "var(--surface)" : "var(--text-2)",
                border: `1px solid ${draft.ai === k ? m.color : "var(--border-strong)"}`,
                fontSize: 13, fontWeight: 500, fontFamily: "inherit",
              }}>
                <span>{m.glyph}</span>{m.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>
            <span>Body</span>
            <span style={{ color: "var(--text-muted-2)", fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
              wrap variables in <code style={{ background: "var(--surface)", padding: "0 4px", borderRadius: 4, border: "1px solid var(--border)" }}>{"{{like_this}}"}</code>
            </span>
          </Label>
          <textarea className="stash-textarea" style={{ width: "100%", boxSizing: "border-box" }}
            value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            placeholder="Your prompt body. Use {{variables}} for anything you'd fill in at run time." />
          {vars.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted-2)" }}>Detected:</span>
              {vars.map(v => (
                <span key={v} style={{ background: `${accent}22`, color: accent, padding: "2px 8px", borderRadius: 999, fontSize: 12, fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>{`{{${v}}}`}</span>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label>Tags <span style={{ color: "var(--text-muted-2)", fontWeight: 400, fontSize: 12, marginLeft: 6 }}>comma-separated</span></Label>
          <input className="stash-input" style={{ width: "100%", boxSizing: "border-box" }}
            value={(draft.tags || []).join(", ")}
            onChange={(e) => setDraft({ ...draft, tags: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
            placeholder="dev, review, writing…" />
          <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
            {Object.keys(TAG_HUES).filter(t => !(draft.tags || []).includes(t)).slice(0, 8).map(t => (
              <span key={t} onClick={() => setDraft({ ...draft, tags: [...(draft.tags || []), t] })} style={{ cursor: "pointer" }}>
                <Tag size="sm">{t}</Tag>
              </span>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: "12px 22px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Share publicly toggle — solo visible cuando hay sesión iniciada */}
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Checkbox
              checked={draft.public || false}
              accent={accent}
              onChange={() => setDraft({ ...draft, public: !draft.public })}
            />
            <span style={{ fontSize: 13, color: "var(--text-2)", userSelect: "none", cursor: "pointer" }}
              onClick={() => setDraft({ ...draft, public: !draft.public })}>
              Share publicly in Explore
            </span>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ flex: 1, color: "var(--text-muted-2)", fontSize: 12.5, alignSelf: "center" }}>
            {draft.body ? `${draft.body.length} chars · ${vars.length} variable${vars.length !== 1 ? "s" : ""}` : ""}
          </span>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn primary accent={accent} accentInk={accentInk} onClick={onSave}>{draft.id ? "Save changes" : "Save prompt"}</Btn>
        </div>
      </div>
    </Modal>
  );
}

Object.assign(window, { Editor });
