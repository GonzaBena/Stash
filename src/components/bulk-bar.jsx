// src/components/bulk-bar.jsx — BulkBar + ConfirmDeleteModal

function BulkBar({ count, total, onSelectAll, onClear, onDelete }) {
  if (count === 0) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "7px 18px", flexShrink: 0,
      background: "var(--surface)", borderBottom: "1px solid var(--border)",
      animation: "stashFadeIn .15s ease-out",
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
        {count} selected
      </span>
      {count < total && (
        <button className="stash-link" onClick={onSelectAll}>
          Select all {total}
        </button>
      )}
      <div style={{ flex: 1 }} />
      <Btn size="sm" onClick={onDelete} style={{ color: "var(--danger)", borderColor: "rgba(154,58,58,.35)" }}>
        <TrashIcon /> Delete {count}
      </Btn>
      <button className="stash-iconbtn" onClick={onClear} title="Clear selection (Esc)">
        <span style={{ fontSize: 16, lineHeight: 1 }}>×</span>
      </button>
    </div>
  );
}

function ConfirmDeleteModal({ open, count, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onCancel} width={360}>
      <div style={{ padding: "26px 26px 16px" }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: "rgba(154,58,58,.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 14, color: "var(--danger)",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </div>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 22, color: "var(--text)", marginBottom: 8 }}>
          Delete {count} prompt{count !== 1 ? "s" : ""}?
        </div>
        <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55 }}>
          {count === 1
            ? "This prompt will be permanently deleted."
            : `These ${count} prompts will be permanently deleted.`}
          {" "}This action can't be undone.
        </div>
      </div>
      <div style={{ padding: "0 26px 22px", display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn onClick={onCancel}>Cancel</Btn>
        <Btn primary accent="var(--danger)" accentInk="#fff" onClick={onConfirm}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}>
            <path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
          Delete {count}
        </Btn>
      </div>
    </Modal>
  );
}

Object.assign(window, { BulkBar, ConfirmDeleteModal });
