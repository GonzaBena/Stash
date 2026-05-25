// src/components/var-filler.jsx — VarFiller modal

function VarFiller({ open, prompt, onClose, onConfirm, accent, accentInk }) {
  const vars = React.useMemo(() => prompt ? extractVars(prompt.body) : [], [prompt]);
  const [vals, setVals] = React.useState({});
  React.useEffect(() => { if (open) setVals({}); }, [open, prompt?.id]);
  if (!open || !prompt) return null;
  const filled = prompt.body.replace(/\{\{([^}]+)\}\}/g, (_, k) => vals[k.trim()] || `{{${k.trim()}}}`);
  return (
    <Modal open={open} onClose={onClose} width={560}>
      <div style={{ padding: "18px 22px 10px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 22, color: "var(--text)" }}>Fill the blanks</div>
        <div style={{ fontSize: 13, color: "var(--text-muted-2)", marginTop: 2 }}>{prompt.title}</div>
      </div>
      <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12, overflow: "auto" }}>
        {vars.map(v => (
          <div key={v}>
            <Label><code style={{ background: `${accent}22`, color: accent, padding: "1px 6px", borderRadius: 4, fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{`{{${v}}}`}</code></Label>
            <input className="stash-input" autoFocus={v === vars[0]} style={{ width: "100%", boxSizing: "border-box" }}
              value={vals[v] || ""} onChange={(e) => setVals({ ...vals, [v]: e.target.value })}
              placeholder={`value for ${v}…`} />
          </div>
        ))}
        <div>
          <Label>Preview</Label>
          <pre style={{
            margin: 0, fontFamily: "ui-monospace, monospace", fontSize: 12.5, lineHeight: 1.55,
            whiteSpace: "pre-wrap", wordBreak: "break-word",
            background: "var(--bg-soft)", padding: 12, borderRadius: 10, border: "1px solid var(--border)",
            maxHeight: 160, overflow: "auto", color: "var(--text-2)",
          }}>{renderBody(filled, accent)}</pre>
        </div>
      </div>
      <div style={{ padding: "12px 22px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn onClick={() => onConfirm(prompt.body)}>Copy template</Btn>
        <Btn primary accent={accent} accentInk={accentInk} onClick={() => onConfirm(filled)}>Copy filled</Btn>
      </div>
    </Modal>
  );
}

Object.assign(window, { VarFiller });
