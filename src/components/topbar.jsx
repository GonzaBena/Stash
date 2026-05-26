import React, { useMemo } from 'react';
import { Btn, Tag } from '@/ui';
import { AI_META } from '@/data';
import { ipc, isElectron } from '@/lib/platform';
import { MenuIcon, SearchIcon, ArrowUpIcon, ArrowDownIcon, ListIcon, GridIcon, SunIcon, MoonIcon, SettingsIcon, PlusIcon, vToggleBtn } from './icons';
import { SmartSearchInput } from './smart-search';

// ── TopBar ────────────────────────────────────────────────────────────────────
export function TopBar({ q, setQ, view, setView, onNew, accent, accentInk, onMenu, isMobile, dark, onToggleDark, section, libSort, setLibSort, libDir, setLibDir, availableTags, availableUsers }) {

  if (isMobile) {
    return (
      <header style={{
        display: 'flex', flexDirection: 'column',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-soft)', flexShrink: 0,
      }}>
        {/* Row 1: nav controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px 8px' }}>
          <button className="stash-iconbtn" onClick={onMenu} title="Menu">
            <MenuIcon />
          </button>

          {/* Logo */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{
              fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
              fontSize: 22, fontWeight: 500, color: 'var(--text)', lineHeight: 1,
            }}>Stash</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, display: 'inline-block', alignSelf: 'center' }} />
          </div>

          {/* Dark toggle */}
          <button className="stash-iconbtn" onClick={onToggleDark} title={dark ? 'Light mode' : 'Dark mode'}
            style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* View toggle */}
          <div style={{ display: 'flex', padding: 2, background: 'var(--surface)', borderRadius: 9, border: '1px solid var(--border)', gap: 1 }}>
            <button onClick={() => setView('list')} title="List" style={vToggleBtn(view === 'list', accent)}>
              <ListIcon />
            </button>
            <button onClick={() => setView('grid')} title="Grid" style={vToggleBtn(view === 'grid', accent)}>
              <GridIcon />
            </button>
          </div>

          {/* New button — icon only */}
          <Btn primary accent={accent} accentInk={accentInk} onClick={onNew}
            style={{ padding: '6px 10px', minWidth: 0 }}>
            <PlusIcon />
          </Btn>
        </div>

        {/* Row 2: search — mobile oculta en Explore (tiene buscador propio abajo) */}
        {section !== 'explore' && (
          <div style={{ padding: '0 14px 10px' }}>
            <SmartSearchInput
              value={q}
              onChange={setQ}
              availableTags={availableTags}
              availableUsers={availableUsers}
              placeholder="Search… #tag @user"
              accent={accent}
            />
          </div>
        )}
      </header>
    );
  }

  // ── Desktop layout ──────────────────────────────────────────────────────────
  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', borderBottom: '1px solid var(--border)',
      background: 'var(--bg-soft)', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 26, fontWeight: 500, color: 'var(--text)', lineHeight: 1 }}>Stash</span>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: accent, display: 'inline-block', alignSelf: 'center' }} />
      </div>

      {/* Buscador — desktop siempre visible (también en Explore) */}
      <SmartSearchInput
        value={q}
        onChange={setQ}
        availableTags={availableTags}
        availableUsers={availableUsers}
        placeholder={section === 'explore' ? "Search Explore… #tag @creator" : "Search… #tag @user"}
        accent={accent}
        style={{ flex: 1, maxWidth: 520, marginLeft: 18 }}
        extraRight={
          <kbd style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, padding: '1px 6px', fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--text-muted-2)', flexShrink: 0 }}>/</kbd>
        }
      />

      {section === 'library' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8 }}>
          <select
            value={libSort} onChange={e => setLibSort(e.target.value)}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
              padding: '6px 10px', fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)', outline: 'none',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <option value="recent">Recent</option>
            <option value="alpha">Alphabetical</option>
            <option value="uses">Most Used</option>
          </select>
          <button
            className="stash-iconbtn"
            onClick={() => setLibDir(d => d === 'asc' ? 'desc' : 'asc')}
            title={libDir === 'asc' ? 'Ascending' : 'Descending'}
            style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}
          >
            {libDir === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', padding: 2, background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', gap: 1 }}>
        <button onClick={() => setView('list')} title="List view" style={vToggleBtn(view === 'list', accent)}>
          <ListIcon /><span style={{ marginLeft: 6 }}>List</span>
        </button>
        <button onClick={() => setView('grid')} title="Grid view" style={vToggleBtn(view === 'grid', accent)}>
          <GridIcon /><span style={{ marginLeft: 6 }}>Grid</span>
        </button>
      </div>

      <button className="stash-iconbtn" onClick={onToggleDark} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}>
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>

      {isElectron && (
        <button className="stash-iconbtn" onClick={() => ipc.send('open-settings')} title="Configuración"
          style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <SettingsIcon size={15} />
        </button>
      )}

      <Btn primary accent={accent} accentInk={accentInk} onClick={onNew} style={{ paddingLeft: 12 }}>
        <PlusIcon /><span>New</span>
      </Btn>
    </header>
  );
}

// ── MobileFilterBar ───────────────────────────────────────────────────────────
// Tira de chips horizontal para filtrar en mobile (solo se muestra en library)
export function MobileFilterBar({ filter, setFilter, prompts, accent, section, libSort, setLibSort, libDir, setLibDir, onSync, syncing }) {
  if (section !== 'library') return null;

  const counts = useMemo(() => {
    const c = { all: prompts.length, starred: prompts.filter(p => p.star).length };
    Object.keys(AI_META).forEach(k => c[k] = prompts.filter(p => p.ai === k).length);
    return c;
  }, [prompts]);

  const tagCounts = useMemo(() => {
    const c = {};
    prompts.forEach(p => (p.tags || []).forEach(t => c[t] = (c[t] || 0) + 1));
    return c;
  }, [prompts]);

  const Chip = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '5px 11px', borderRadius: 20, whiteSpace: 'nowrap',
        fontSize: 12.5, fontWeight: active ? 600 : 500,
        background: active ? accent : 'var(--surface)',
        color: active ? '#fff' : 'var(--text-2)',
        border: `1px solid ${active ? accent : 'var(--border)'}`,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'background .1s, color .1s',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );

  const sortLabels = { recent: 'Recent', alpha: 'A–Z', uses: 'Most used' };

  return (
    <React.Fragment>
      {/* Fila 1: chips de filtro — scroll horizontal */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px',
        overflowX: 'auto', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-soft)',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
        flexShrink: 0,
      }}>
        {/* Scope chips */}
        <Chip
          active={filter.scope === 'all' && !filter.ai && !(filter.tags?.length)}
          onClick={() => setFilter({ scope: 'all', ai: null, tags: [] })}
        >
          ≡ All <span style={{ opacity: .55, fontSize: 11, fontWeight: 400 }}>{counts.all}</span>
        </Chip>

        <Chip
          active={filter.scope === 'starred'}
          onClick={() => setFilter({ ...filter, scope: filter.scope === 'starred' ? 'all' : 'starred' })}
        >
          ★ Starred <span style={{ opacity: .55, fontSize: 11, fontWeight: 400 }}>{counts.starred}</span>
        </Chip>

        {/* Divider */}
        <span style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0 }} />

        {/* AI model chips */}
        {Object.entries(AI_META).filter(([k]) => counts[k] > 0).map(([k, m]) => (
          <Chip
            key={k}
            active={filter.ai === k}
            onClick={() => setFilter({ ...filter, scope: 'all', ai: filter.ai === k ? null : k })}
          >
            <span style={{ fontWeight: 700 }}>{m.glyph}</span> {m.short}
            <span style={{ opacity: .55, fontSize: 11, fontWeight: 400 }}>{counts[k]}</span>
          </Chip>
        ))}

        {/* Tag chips (top 10) */}
        {Object.keys(tagCounts).length > 0 && (
          <span style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0 }} />
        )}
        {Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t, n]) => {
          const active = (filter.tags || []).includes(t);
          return (
            <Chip
              key={t}
              active={active}
              onClick={() => {
                const tags = filter.tags || [];
                const nextTags = active ? tags.filter(x => x !== t) : [...tags, t];
                setFilter({ ...filter, tags: nextTags });
              }}
            >
              #{t} <span style={{ opacity: .55, fontSize: 11, fontWeight: 400 }}>{n}</span>
            </Chip>
          );
        })}
      </div>

      {/* Fila 2: ordenamiento */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2,
        padding: '5px 14px 6px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-soft)',
        flexShrink: 0,
      }}>
        {/* Botón recarga */}
        <button
          onClick={onSync}
          disabled={syncing || !onSync}
          title="Sync with cloud"
          style={{
            marginRight: 6, width: 28, height: 28, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 7, border: '1px solid var(--border)',
            background: 'var(--surface)', cursor: (syncing || !onSync) ? 'not-allowed' : 'pointer',
            opacity: (syncing || !onSync) ? 0.4 : 1, transition: 'opacity .15s',
            color: 'var(--text-2)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"
            style={{ display: 'block', animation: syncing ? 'stashSpin .7s linear infinite' : 'none' }}>
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
        <span style={{ fontSize: 11.5, color: 'var(--text-faint)', marginRight: 6, flexShrink: 0 }}>Sort</span>
        <span style={{ flex: 1 }} />
        {Object.entries(sortLabels).map(([s, label]) => (
          <button key={s} onClick={() => setLibSort(s)} style={{
            padding: '4px 11px', borderRadius: 20, fontSize: 12,
            fontWeight: libSort === s ? 600 : 500,
            background: libSort === s ? 'var(--surface)' : 'transparent',
            color: libSort === s ? 'var(--text)' : 'var(--text-faint)',
            border: `1px solid ${libSort === s ? 'var(--border)' : 'transparent'}`,
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            transition: 'background .1s',
          }}>
            {label}
          </button>
        ))}
        {/* Botón dirección */}
        <button
          onClick={() => setLibDir(d => d === 'asc' ? 'desc' : 'asc')}
          title={libDir === 'asc' ? 'Ascending' : 'Descending'}
          style={{
            marginLeft: 4, width: 28, height: 28, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 7, border: '1px solid var(--border)',
            background: 'var(--surface)', cursor: 'pointer',
            color: 'var(--text-2)', fontSize: 14,
          }}
        >
          {libDir === 'asc' ? '↑' : '↓'}
        </button>
      </div>
    </React.Fragment>
  );
}
