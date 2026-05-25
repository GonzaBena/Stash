// src/components/grid-view.jsx — GridView card layout

function GridView({ prompts, setSel, toggleStar, accent, density, onCopy, onEdit, selectedIds, onToggleSelect, onTagClick, activeTags = [] }) {
  const d = DENSITY[density];
  const colMin = density === "compact" ? 240 : density === "spacious" ? 320 : 280;
  if (prompts.length === 0) return <div style={{ flex: 1, overflow: "auto", padding: 20 }}><EmptyState /></div>;
  return (
    <div style={{ flex: 1, overflow: "auto", padding: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${colMin}px, 1fr))`, gap: d.gap + 2 }}>
        {prompts.map(p => {
          const vars = extractVars(p.body);
          const m = AI_META[p.ai];
          const isSel = selectedIds.has(p.id);
          return (
            <div key={p.id} className="stash-card" onClick={() => setSel(p.id)} style={{
              background: "var(--surface)", borderRadius: 14, padding: d.card + 2,
              border: `1px solid ${isSel ? accent : "var(--border)"}`,
              outline: isSel ? `2px solid ${accent}55` : "none",
              cursor: "pointer", display: "flex", flexDirection: "column", gap: 8,
              minHeight: 180, position: "relative", overflow: "hidden",
            }}>
              {/* model color stripe on top */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: m.color }} />
              {/* selection checkbox — top-left corner */}
              <div style={{ position: "absolute", top: 10, left: 10, zIndex: 2 }}
                onClick={(e) => { e.stopPropagation(); onToggleSelect(p.id); }}>
                <Checkbox checked={isSel} accent={accent} onChange={() => onToggleSelect(p.id)} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, paddingLeft: 22 }}>
                <AIBadge ai={p.ai} size="sm" />
                {vars.length > 0 && (
                  <span style={{ fontSize: 11, color: accent, fontFamily: "ui-monospace, monospace", padding: "1px 7px", borderRadius: 999, background: `${accent}1f`, fontWeight: 600 }}>
                    {`{{${vars.length}}}`}
                  </span>
                )}
                <span style={{ marginLeft: "auto" }}>
                  <Star on={p.star} onClick={() => toggleStar(p.id)} accent={accent} size={16} />
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: d.font + 2, lineHeight: 1.25, color: "var(--text)" }}>{p.title}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.5, flex: 1,
                display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>{renderBody(p.body.split("\n")[0], accent)}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {p.tags.map(t => (
                  <Tag key={t} size="sm" on={activeTags.includes(t)} onClick={onTagClick ? (e) => { e.stopPropagation(); onTagClick(t); } : null}>{t}</Tag>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, paddingTop: 6, borderTop: "1px dashed var(--border)", marginTop: 2 }}>
                <span style={{ color: "var(--text-faint)", fontSize: 11.5 }}>{p.uses}× · {p.edited} ago</span>
                <button className="stash-iconbtn" style={{ marginLeft: "auto" }} title="Copy" onClick={(e) => { e.stopPropagation(); onCopy(p); }}>
                  <CopyIcon />
                </button>
                {!p.source_id && (
                  <button className="stash-iconbtn" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(p); }}>
                    <EditIcon />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { GridView });
