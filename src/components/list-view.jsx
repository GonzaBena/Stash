// src/components/list-view.jsx — ListView, Splitter, EmptyState

function EmptyState() {
  return (
    <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted-2)" }}>
      <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 26, color: "var(--text-2)", marginBottom: 6 }}>Nothing here yet</div>
      <div style={{ fontSize: 13.5 }}>Try clearing a filter, or hit <kbd style={{ background: "var(--surface)", padding: "1px 6px", borderRadius: 5, border: "1px solid var(--border)", fontFamily: "ui-monospace, monospace", fontSize: 12 }}>N</kbd> to save a new one.</div>
    </div>
  );
}

function ListView({ prompts, selId, setSel, toggleStar, accent, density, selectedIds, onToggleSelect, onSelectAllVisible, onTagClick, activeTags = [] }) {
  const d = DENSITY[density];
  const allSelected   = prompts.length > 0 && prompts.every(p => selectedIds.has(p.id));
  const someSelected  = prompts.some(p => selectedIds.has(p.id));
  const cols = "20px auto 1fr auto auto";
  return (
    <div style={{ flex: 1, overflow: "auto", borderRight: "1px solid var(--border)", background: "var(--surface)" }}>
      {/* header */}
      <div style={{ display: "grid", gridTemplateColumns: cols, padding: "10px 18px 8px", alignItems: "center", fontSize: 11, color: "var(--text-faint)", letterSpacing: 0.7, textTransform: "uppercase", fontWeight: 600, borderBottom: "1px solid var(--border)", gap: 12 }}>
        <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} accent={accent}
          onChange={() => allSelected ? onSelectAllVisible([], true) : onSelectAllVisible(prompts.map(p => p.id))} />
        <span style={{ width: 14 }} />
        <span>Title</span>
        <span>Model</span>
        <span style={{ minWidth: 60, textAlign: "right" }}>Used</span>
      </div>
      {prompts.length === 0 ? (
        <EmptyState />
      ) : prompts.map(p => {
        const isSel  = selectedIds.has(p.id);
        return (
          <div key={p.id} onClick={() => setSel(p.id)} className="stash-row" style={{
            display: "grid", gridTemplateColumns: cols,
            gap: 12, alignItems: "center",
            padding: `${d.row}px 18px`,
            borderBottom: "1px solid var(--border-soft)",
            background: isSel ? `${accent}14` : selId === p.id ? "rgba(0,0,0,.025)" : "transparent",
            borderLeft: `3px solid ${isSel ? accent : selId === p.id ? accent : "transparent"}`,
            paddingLeft: 15, cursor: "pointer",
          }}>
            <Checkbox checked={isSel} accent={accent} onChange={() => onToggleSelect(p.id)} />
            <Star on={p.star} onClick={() => toggleStar(p.id)} accent={accent} size={15} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: d.font + 0.5, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
              <div style={{ display: "flex", gap: 5, marginTop: 3, flexWrap: "wrap" }}>
                {p.tags.map(t => (
                  <Tag key={t} size="sm" on={activeTags.includes(t)} onClick={onTagClick ? (e) => { e.stopPropagation(); onTagClick(t); } : null}>{t}</Tag>
                ))}
                {extractVars(p.body).length > 0 && (
                  <span style={{ fontSize: 11, color: accent, fontFamily: "ui-monospace, monospace", padding: "1px 6px", borderRadius: 999, background: `${accent}1f`, fontWeight: 600 }}>
                    {`{{${extractVars(p.body).length}}}`}
                  </span>
                )}
              </div>
            </div>
            <AIBadge ai={p.ai} size="sm" />
            <span style={{ color: "var(--text-faint)", fontSize: 12.5, fontVariantNumeric: "tabular-nums", minWidth: 60, textAlign: "right" }}>{p.uses}×</span>
          </div>
        );
      })}
    </div>
  );
}

function Splitter({ onDrag, accent }) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const onMouseDown = (e) => {
    e.preventDefault();
    setActive(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const move = (ev) => onDrag(ev.clientX);
    const up = () => {
      setActive(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };
  const onTouchStart = (e) => {
    const move = (ev) => onDrag(ev.touches[0].clientX);
    const up = () => {
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", up);
  };
  const showAccent = hover || active;
  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDoubleClick={() => onDrag(null)}
      title="Drag to resize · double-click to reset"
      style={{
        flex: "0 0 6px", cursor: "col-resize", position: "relative",
        background: "transparent",
        borderLeft: "1px solid var(--border)",
        marginLeft: -1,
        zIndex: 5,
      }}
    >
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 3, height: 36, borderRadius: 999,
        background: showAccent ? accent : "transparent",
        transition: "background .15s",
      }} />
    </div>
  );
}

Object.assign(window, { ListView, Splitter, EmptyState });
