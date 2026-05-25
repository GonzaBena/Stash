// src/components/topbar.jsx — Top header bar

const { ipcRenderer } = require('electron');

function TopBar({ q, setQ, view, setView, onNew, accent, accentInk, onMenu, isMobile, dark, onToggleDark }) {
  return (
    <header style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 16px", borderBottom: "1px solid var(--border)",
      background: "var(--bg-soft)", flexShrink: 0,
    }}>
      {isMobile && <button className="stash-iconbtn" onClick={onMenu} title="Menu"><MenuIcon /></button>}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 26, fontWeight: 500, color: "var(--text)", lineHeight: 1 }}>Stash</span>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: accent, display: "inline-block", alignSelf: "center" }} />
      </div>
      <div style={{
        flex: 1, maxWidth: 520, marginLeft: isMobile ? 4 : 18,
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
        padding: "7px 12px",
      }}>
        <span style={{ color: "var(--text-faint)", display: "flex" }}><SearchIcon /></span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, body, tag, model…" style={{
          flex: 1, border: 0, outline: 0, background: "transparent", fontFamily: "inherit", fontSize: 13.5, color: "var(--text)",
        }} />
        {q && <button className="stash-iconbtn" onClick={() => setQ("")} style={{ width: 22, height: 22 }}><span style={{ fontSize: 14 }}>×</span></button>}
        <kbd style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 5, padding: "1px 6px", fontFamily: "ui-monospace, monospace", fontSize: 11, color: "var(--text-muted-2)" }}>/</kbd>
      </div>

      {/* view toggle */}
      <div style={{
        display: "flex", padding: 2, background: "var(--surface)", borderRadius: 10,
        border: "1px solid var(--border)", gap: 1,
      }}>
        <button onClick={() => setView("list")} title="List view" style={vToggleBtn(view === "list", accent)}>
          <ListIcon />{!isMobile && <span style={{ marginLeft: 6 }}>List</span>}
        </button>
        <button onClick={() => setView("grid")} title="Grid view" style={vToggleBtn(view === "grid", accent)}>
          <GridIcon />{!isMobile && <span style={{ marginLeft: 6 }}>Grid</span>}
        </button>
      </div>

      <button className="stash-iconbtn" onClick={onToggleDark} title={dark ? "Switch to light mode" : "Switch to dark mode"}
        style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)" }}>
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>

      <button className="stash-iconbtn" onClick={() => ipcRenderer.send('open-settings')} title="Configuración"
        style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)" }}>
        <SettingsIcon size={15} />
      </button>

      <Btn primary accent={accent} accentInk={accentInk} onClick={onNew} style={{ paddingLeft: 12 }}>
        <PlusIcon />{!isMobile && <span>New</span>}
      </Btn>
    </header>
  );
}

Object.assign(window, { TopBar });
