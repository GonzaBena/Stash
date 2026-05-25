// settings.js — Stash Settings window (vanilla JS, sin bundler)

(function () {
  'use strict';

  const { ipcRenderer } = require('electron');

  // ── Referencias DOM ─────────────────────────────────────────────────────────
  const shortcutChip   = document.getElementById('shortcut-display');
  const recordBtn      = document.getElementById('shortcut-record-btn');
  const shortcutHint   = document.getElementById('shortcut-hint');
  const shortcutError  = document.getElementById('shortcut-error');
  const loginCheckbox  = document.getElementById('login-checkbox');
  const loginRow       = document.getElementById('login-row');
  const cancelBtn      = document.getElementById('settings-cancel-btn');
  const saveBtn        = document.getElementById('settings-save-btn');
  const resetBtn       = document.getElementById('settings-reset-btn');
  const saveError      = document.getElementById('settings-save-error');
  const closeBtn       = document.getElementById('settings-close');

  // ── Valores por defecto ──────────────────────────────────────────────────────
  const DEFAULTS = { shortcut: 'Alt+Space', openAtLogin: false };

  // ── Estado local ────────────────────────────────────────────────────────────
  let currentShortcut  = 'Alt+Space';
  let pendingShortcut  = 'Alt+Space';
  let openAtLogin      = false;
  let recording        = false;

  // ── Helpers ─────────────────────────────────────────────────────────────────

  // Convierte un KeyboardEvent en un string de acelerador Electron
  // Ej: Ctrl+Shift+P, Alt+Space, Ctrl+K
  function eventToAccelerator(e) {
    const parts = [];
    if (e.ctrlKey)  parts.push('Ctrl');
    if (e.altKey)   parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey)  parts.push('Super');

    const key = e.key;

    // Ignorar pulsaciones de solo modificador
    if (['Control','Alt','Shift','Meta'].includes(key)) return null;

    // Normalizar teclas especiales al formato de Electron
    const MAP = {
      ' ': 'Space', 'ArrowUp': 'Up', 'ArrowDown': 'Down',
      'ArrowLeft': 'Left', 'ArrowRight': 'Right',
      'Enter': 'Return', 'Escape': 'Escape', 'Backspace': 'Backspace',
      'Delete': 'Delete', 'Tab': 'Tab', 'Home': 'Home', 'End': 'End',
      'PageUp': 'PageUp', 'PageDown': 'PageDown', 'Insert': 'Insert',
    };
    parts.push(MAP[key] ?? (key.length === 1 ? key.toUpperCase() : key));

    // Exigir al menos un modificador para evitar interceptar teclas simples
    const hasModifier = e.ctrlKey || e.altKey || e.shiftKey || e.metaKey;
    if (!hasModifier) return null;

    return parts.join('+');
  }

  function setRecording(on) {
    recording = on;
    recordBtn.classList.toggle('active', on);
    shortcutChip.classList.toggle('recording', on);
    shortcutHint.textContent = on
      ? 'Presiona la combinación deseada… (Esc para cancelar)'
      : 'Haz clic en Grabar y presiona la combinación deseada';
    shortcutError.hidden = true;
  }

  function setCheckbox(checked) {
    openAtLogin = checked;
    loginCheckbox.setAttribute('aria-checked', String(checked));
  }

  function hideError() {
    saveError.hidden = true;
    saveError.textContent = '';
  }

  // ── Cargar settings actuales desde el proceso principal ─────────────────────
  async function loadSettings() {
    try {
      const s = await ipcRenderer.invoke('get-settings');
      currentShortcut = s.shortcut || 'Alt+Space';
      pendingShortcut = currentShortcut;
      shortcutChip.textContent = currentShortcut;
      setCheckbox(!!s.openAtLogin);
    } catch (err) {
      console.warn('[Settings] get-settings falló:', err.message);
    }
  }

  // ── Grabar atajo ─────────────────────────────────────────────────────────────
  recordBtn.addEventListener('click', () => {
    setRecording(!recording);
  });

  document.addEventListener('keydown', (e) => {
    if (!recording) return;
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      // Cancelar grabación
      setRecording(false);
      shortcutChip.textContent = pendingShortcut;
      return;
    }

    const acc = eventToAccelerator(e);
    if (!acc) return;

    pendingShortcut = acc;
    shortcutChip.textContent = acc;
    setRecording(false);
  }, true); // capture = true para interceptar antes que otros listeners

  // ── Toggle auto-inicio ───────────────────────────────────────────────────────
  loginRow.addEventListener('click', () => setCheckbox(!openAtLogin));
  loginCheckbox.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setCheckbox(!openAtLogin); }
  });

  // ── Guardar ─────────────────────────────────────────────────────────────────
  saveBtn.addEventListener('click', async () => {
    hideError();
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando…';

    try {
      const result = await ipcRenderer.invoke('save-settings', {
        shortcut: pendingShortcut,
        openAtLogin,
      });

      if (result.error) {
        saveError.textContent = result.error;
        saveError.hidden = false;
      } else {
        currentShortcut = pendingShortcut;
        ipcRenderer.send('settings-hide');
      }
    } catch (err) {
      saveError.textContent = 'Error inesperado: ' + err.message;
      saveError.hidden = false;
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar';
    }
  });

  // ── Cancelar / cerrar ────────────────────────────────────────────────────────
  function cancel() {
    setRecording(false);
    pendingShortcut = currentShortcut;
    shortcutChip.textContent = currentShortcut;
    hideError();
    ipcRenderer.send('settings-hide');
  }

  cancelBtn.addEventListener('click', cancel);
  closeBtn.addEventListener('click', cancel);

  // ── Resetear a valores por defecto ───────────────────────────────────────────
  resetBtn.addEventListener('click', async () => {
    hideError();
    setRecording(false);

    // Aplicar defaults en la UI
    pendingShortcut = DEFAULTS.shortcut;
    shortcutChip.textContent = DEFAULTS.shortcut;
    setCheckbox(DEFAULTS.openAtLogin);

    // Guardar inmediatamente
    resetBtn.disabled = true;
    resetBtn.textContent = 'Reseteando…';

    try {
      const result = await ipcRenderer.invoke('save-settings', {
        shortcut:    DEFAULTS.shortcut,
        openAtLogin: DEFAULTS.openAtLogin,
      });

      if (result.error) {
        saveError.textContent = result.error;
        saveError.hidden = false;
      } else {
        currentShortcut = DEFAULTS.shortcut;
        ipcRenderer.send('settings-hide');
      }
    } catch (err) {
      saveError.textContent = 'Error inesperado: ' + err.message;
      saveError.hidden = false;
    } finally {
      resetBtn.disabled = false;
      resetBtn.textContent = 'Resetear';
    }
  });

  // ── Recargar settings cada vez que la ventana se muestre ────────────────────
  window.addEventListener('focus', loadSettings);

  // ── Init ────────────────────────────────────────────────────────────────────
  loadSettings();

})();
