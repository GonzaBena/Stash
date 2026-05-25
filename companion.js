// companion.js — Stash Companion (vanilla JS, sin React, sin bundler)
// nodeIntegration: true → require('electron') disponible directamente en el renderer

(function () {
  'use strict';

  const { ipcRenderer, clipboard } = require('electron');

  // ── Colores por modelo (igual que AI_META en data.jsx) ─────────────────────
  const AI_COLORS = {
    claude:     '#d97757',
    chatgpt:    '#10a37f',
    gemini:     '#5b8def',
    perplexity: '#20808d',
    generic:    '#6b6358',
  };

  // ── Referencias DOM ─────────────────────────────────────────────────────────
  const input    = document.getElementById('companion-input');
  const list     = document.getElementById('companion-list');
  const emptyMsg = document.getElementById('companion-empty');

  // ── Estado ──────────────────────────────────────────────────────────────────
  let allPrompts     = [];
  let currentQuery   = '';
  let filteredPrompts = [];  // prompts actualmente visibles
  let selectedIndex  = -1;  // -1 = ninguno seleccionado

  // ── Leer prompts desde localStorage (compartido con Stash.html) ────────────
  function loadPrompts() {
    try {
      const raw = localStorage.getItem('stash:prompts');
      const parsed = raw ? JSON.parse(raw) : [];
      allPrompts = Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      allPrompts = [];
    }
  }

  // ── Escape HTML para usar innerHTML con datos del usuario ──────────────────
  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Filtrar: title + body, case-insensitive ─────────────────────────────────
  function filterPrompts(query) {
    if (!query) return allPrompts;
    const q = query.toLowerCase();
    return allPrompts.filter(p =>
      ((p.title || '') + ' ' + (p.body || '')).toLowerCase().includes(q)
    );
  }

  // ── Mover selección visual a un índice dado ─────────────────────────────────
  function setSelected(idx) {
    const cards = list.querySelectorAll('.companion-card');
    if (!cards.length) return;

    // Clamp al rango válido
    idx = Math.max(0, Math.min(idx, cards.length - 1));
    selectedIndex = idx;

    // Quitar highlight anterior
    cards.forEach(c => c.classList.remove('companion-card--selected'));

    // Aplicar highlight y hacer scroll si está fuera del viewport del list
    const target = cards[selectedIndex];
    target.classList.add('companion-card--selected');
    target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // ── Renderizar lista ────────────────────────────────────────────────────────
  function render(prompts) {
    filteredPrompts = prompts;
    selectedIndex   = -1;

    if (prompts.length === 0) {
      list.hidden     = true;
      emptyMsg.hidden = !currentQuery; // solo visible si hay búsqueda activa sin resultados
      return;
    }

    list.hidden     = false;
    emptyMsg.hidden = true;

    // DocumentFragment: un solo reflow al final
    const frag = document.createDocumentFragment();

    prompts.forEach(p => {
      const card = document.createElement('div');
      card.className = 'companion-card';
      card.setAttribute('role', 'option');

      // Badge: sin source_id → "Mío" (amber) | con source_id → "Guardado" (gris)
      const isMine     = !p.source_id;
      const badgeClass = isMine ? 'companion-badge companion-badge--mine' : 'companion-badge companion-badge--saved';
      const badgeText  = isMine ? 'Mío' : 'Guardado';

      // Dot de color del modelo
      const dotColor = AI_COLORS[p.ai] || AI_COLORS.generic;

      // Preview: primeros 80 chars del body, sin saltos de línea
      const preview = (p.body || '').replace(/\s+/g, ' ').trim().slice(0, 80);

      card.innerHTML = `
        <div class="companion-card-dot" style="background:${dotColor}"></div>
        <div class="companion-card-body">
          <div class="companion-card-title">${esc(p.title || 'Sin título')}</div>
          <div class="companion-card-preview">${esc(preview)}</div>
        </div>
        <span class="${badgeClass}">${badgeText}</span>
      `;

      // Click con mouse: seleccionar directamente
      card.addEventListener('click', () => selectPrompt(p));

      // Hover: actualizar selectedIndex para que Enter funcione si el usuario
      // mezcla mouse y teclado
      card.addEventListener('mouseenter', () => {
        const cards = list.querySelectorAll('.companion-card');
        const idx   = Array.prototype.indexOf.call(cards, card);
        if (idx !== -1) {
          cards.forEach(c => c.classList.remove('companion-card--selected'));
          card.classList.add('companion-card--selected');
          selectedIndex = idx;
        }
      });

      frag.appendChild(card);
    });

    list.innerHTML = '';
    list.appendChild(frag);
  }

  // ── Seleccionar un prompt: copiar + ocultar ─────────────────────────────────
  function selectPrompt(p) {
    try {
      clipboard.writeText(p.body || '');
    } catch (err) {
      console.warn('[Companion] clipboard.writeText falló:', err.message);
    }
    ipcRenderer.send('companion-hide');
  }

  // ── Aplicar filtro y re-renderizar ──────────────────────────────────────────
  function applyFilter(query) {
    currentQuery = query;
    render(filterPrompts(query));
  }

  // ── Refrescar datos y UI (se llama al abrir la ventana) ────────────────────
  function refresh() {
    loadPrompts();
    applyFilter(currentQuery);
    input.focus();
    input.select(); // Selecciona texto previo para reescribir directamente
  }

  // ── Event listeners ─────────────────────────────────────────────────────────

  // Búsqueda reactiva (sin debounce: datos locales, no hay I/O)
  input.addEventListener('input', () => applyFilter(input.value.trim()));

  // Teclado: navegación con flechas + Enter desde el input
  input.addEventListener('keydown', (e) => {
    const cards = list.querySelectorAll('.companion-card');
    if (!cards.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(selectedIndex < 0 ? 0 : selectedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (selectedIndex <= 0) {
        // Volver al inicio de la lista (deseleccionar)
        cards.forEach(c => c.classList.remove('companion-card--selected'));
        selectedIndex = -1;
      } else {
        setSelected(selectedIndex - 1);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = selectedIndex >= 0 ? selectedIndex : 0;
      if (filteredPrompts[idx]) selectPrompt(filteredPrompts[idx]);
    }
  });

  // Escape: ocultar ventana (desde cualquier parte del documento)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); ipcRenderer.send('companion-hide'); }
  });

  // main.js emite 'companion-refresh' cada vez que muestra la ventana (Alt+Space)
  ipcRenderer.on('companion-refresh', refresh);

  // Fallback: refrescar también al recibir foco (ej.: el usuario hace clic en la ventana)
  window.addEventListener('focus', refresh);

  // ── Init ────────────────────────────────────────────────────────────────────
  loadPrompts();
  render(allPrompts);
  input.focus();

})();
