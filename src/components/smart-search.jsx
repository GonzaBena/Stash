/**
 * smart-search.jsx
 * Buscador inteligente con soporte para:
 *   #tag   → filtra por etiqueta
 *   @user  → filtra por nombre de creador
 *
 * Exports:
 *   parseSearchQuery(q) → { tags, users, text }
 *   SmartSearchInput    → componente de búsqueda con autocomplete
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SearchIcon } from './icons';

// ── Parser ────────────────────────────────────────────────────────────────────
/**
 * Separa el query en tokens especiales y texto libre.
 * "#python @john prompts de código"
 *   → { tags: ['python'], users: ['john'], text: 'prompts de código' }
 */
export function parseSearchQuery(q) {
  if (!q) return { tags: [], users: [], text: '' };
  const tags = [];
  const users = [];

  let text = q;
  text = text.replace(/#([\w\-]+)/g, (_, t) => { tags.push(t.toLowerCase()); return ' '; });
  text = text.replace(/@([\w.\-]+)/g, (_, u) => { users.push(u.toLowerCase()); return ' '; });
  text = text.replace(/\s{2,}/g, ' ').trim();

  return { tags, users, text };
}

// ── SmartSearchInput ──────────────────────────────────────────────────────────
/**
 * Props:
 *   value           string        — valor controlado del input
 *   onChange        fn(string)    — callback al cambiar
 *   availableTags   string[]      — lista de tags para autocompletar
 *   availableUsers  string[]      — lista de usuarios para autocompletar
 *   placeholder     string
 *   accent          string        — color de acento para chips de #tag
 *   style           object        — estilos del wrapper exterior (position: relative incluido)
 *   extraRight      ReactNode     — contenido extra a la derecha del input (ej. <kbd>/</kbd>)
 */
export function SmartSearchInput({
  value = '',
  onChange,
  availableTags = [],
  availableUsers = [],
  placeholder = 'Search…',
  accent = '#f2a23b',
  style = {},
  extraRight = null,
}) {
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [dropdown, setDropdown] = useState(null);
  // dropdown: { type: 'tag'|'user', query: string, items: string[] } | null

  const parsed = parseSearchQuery(value);
  const hasTokens = parsed.tags.length > 0 || parsed.users.length > 0;

  // Cierra dropdown al clickear fuera
  useEffect(() => {
    if (!dropdown) return;
    const onPtr = (e) => {
      if (!containerRef.current?.contains(e.target)) setDropdown(null);
    };
    document.addEventListener('pointerdown', onPtr);
    return () => document.removeEventListener('pointerdown', onPtr);
  }, [dropdown]);

  // Calcula qué mostrar en el dropdown según la posición del cursor
  const computeDropdown = useCallback((val, cursor) => {
    const before = val.slice(0, cursor ?? val.length);
    const hashMatch = before.match(/#([\w\-]*)$/);
    const atMatch   = before.match(/@([\w.\-]*)$/);

    if (hashMatch) {
      const q = hashMatch[1].toLowerCase();
      const items = availableTags
        .filter(t => t.toLowerCase().startsWith(q) && !parsed.tags.includes(t.toLowerCase()))
        .slice(0, 8);
      // Mostrar dropdown aunque el query esté vacío (todos los tags disponibles)
      const show = availableTags
        .filter(t => t.toLowerCase().startsWith(q))
        .slice(0, 8);
      return show.length > 0 ? { type: 'tag', query: q, items: show } : null;
    }

    if (atMatch) {
      const q = atMatch[1].toLowerCase();
      const show = availableUsers
        .filter(u => u.toLowerCase().startsWith(q))
        .slice(0, 8);
      return show.length > 0 ? { type: 'user', query: q, items: show } : null;
    }

    return null;
  }, [availableTags, availableUsers, parsed.tags]);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    setDropdown(computeDropdown(val, e.target.selectionStart));
  };

  const handleKeyDown = (e) => {
    if (!dropdown) return;
    if (e.key === 'Escape') { setDropdown(null); e.preventDefault(); }
    if (e.key === 'Tab' && dropdown.items.length > 0) {
      e.preventDefault();
      selectItem(dropdown.items[0]);
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      setDropdown(computeDropdown(value, inputRef.current?.selectionStart));
    }
  };

  const selectItem = (item) => {
    const prefix  = dropdown.type === 'tag' ? '#' : '@';
    const trigger = dropdown.type === 'tag' ? /#([\w\-]*)$/ : /@([\w.\-]*)$/;
    const cursor  = inputRef.current?.selectionStart ?? value.length;
    const before  = value.slice(0, cursor).replace(trigger, `${prefix}${item} `);
    const after   = value.slice(cursor);
    const newVal  = (before + after).replace(/\s{2,}/g, ' ').trimStart();
    onChange(newVal);
    setDropdown(null);
    setTimeout(() => {
      inputRef.current?.focus();
      const pos = before.length;
      inputRef.current?.setSelectionRange(pos, pos);
    }, 0);
  };

  const removeToken = (token, type) => {
    const prefix  = type === 'tag' ? '#' : '@';
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`${prefix}${escaped}(?=[\\s]|$)`, 'gi');
    const newVal = value.replace(re, '').replace(/\s{2,}/g, ' ').trim();
    onChange(newVal);
  };

  const clearAll = () => { onChange(''); setDropdown(null); };

  return (
    <div ref={containerRef} style={{ position: 'relative', ...style }}>

      {/* ── Caja de input ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '7px 12px',
      }}>
        <span style={{ color: 'var(--text-faint)', display: 'flex', flexShrink: 0 }}>
          <SearchIcon />
        </span>

        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          placeholder={placeholder}
          style={{
            flex: 1, border: 0, outline: 0, background: 'transparent',
            fontFamily: 'inherit', fontSize: 13.5, color: 'var(--text)',
            minWidth: 0,
          }}
        />

        {value && (
          <button
            className="stash-iconbtn"
            onClick={clearAll}
            style={{ width: 22, height: 22, flexShrink: 0 }}
          >
            <span style={{ fontSize: 14 }}>×</span>
          </button>
        )}

        {extraRight}
      </div>

      {/* ── Chips de tokens activos ── */}
      {hasTokens && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '5px 2px 0' }}>
          {parsed.tags.map(t => (
            <TokenChip
              key={`tag:${t}`}
              label={`#${t}`}
              color={accent}
              onRemove={() => removeToken(t, 'tag')}
            />
          ))}
          {parsed.users.map(u => (
            <TokenChip
              key={`user:${u}`}
              label={`@${u}`}
              color="#0ea5e9"
              onRemove={() => removeToken(u, 'user')}
            />
          ))}
        </div>
      )}

      {/* ── Dropdown de autocompletado ── */}
      {dropdown && dropdown.items.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, boxShadow: '0 6px 24px rgba(0,0,0,.14)',
          zIndex: 200, overflow: 'hidden',
        }}>
          {/* Header del dropdown */}
          <div style={{
            padding: '6px 12px 4px',
            fontSize: 10.5, color: 'var(--text-faint)',
            letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600,
            borderBottom: '1px solid var(--border-soft)',
          }}>
            {dropdown.type === 'tag' ? '# Etiquetas' : '@ Usuarios'}
          </div>

          {dropdown.items.map((item, i) => (
            <button
              key={item}
              onPointerDown={(e) => { e.preventDefault(); selectItem(item); }}
              className="stash-row"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '7px 14px',
                border: 'none', borderTop: i === 0 ? 'none' : '1px solid var(--border-soft)',
                background: 'none', textAlign: 'left', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13, color: 'var(--text)',
              }}
            >
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: dropdown.type === 'tag' ? accent : '#0ea5e9',
                width: 14, textAlign: 'center', flexShrink: 0,
              }}>
                {dropdown.type === 'tag' ? '#' : '@'}
              </span>
              <span style={{ flex: 1 }}>
                {/* Resaltar la parte que coincide con el query */}
                {highlightMatch(item, dropdown.query, dropdown.type === 'tag' ? accent : '#0ea5e9')}
              </span>
              <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>Tab ↹</span>
            </button>
          ))}

          {/* Hint */}
          <div style={{
            padding: '4px 12px 6px',
            fontSize: 10.5, color: 'var(--text-faint)',
            borderTop: '1px solid var(--border-soft)',
          }}>
            Click o Tab para seleccionar · Esc para cerrar
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function TokenChip({ label, color, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      padding: '2px 6px 2px 8px', borderRadius: 999,
      background: `${color}18`,
      border: `1px solid ${color}40`,
      color, fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit',
    }}>
      {label}
      <button
        onPointerDown={(e) => { e.preventDefault(); onRemove(); }}
        style={{
          border: 'none', background: 'none', padding: '0 1px',
          cursor: 'pointer', color: 'inherit', opacity: 0.65,
          display: 'flex', alignItems: 'center', lineHeight: 1, fontSize: 13,
        }}
        title="Quitar filtro"
      >
        ×
      </button>
    </span>
  );
}

function highlightMatch(text, query, color) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <strong style={{ color }}>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  );
}
