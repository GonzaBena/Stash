const { app, BrowserWindow, ipcMain, shell, globalShortcut, screen, Tray, Menu, nativeImage } = require('electron');
const http   = require('http');
const urlMod = require('url');
const path   = require('path');
const fs     = require('fs');

let mainWin      = null;
let companionWin = null;
let settingsWin  = null;
let tray         = null;
let isQuitting   = false;  // distingue "ocultar al tray" de "salir de verdad"

// ── Persistencia de settings ──────────────────────────────────────────────────
const SETTINGS_PATH = () => path.join(app.getPath('userData'), 'settings.json');

function loadSettingsFile() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH(), 'utf8'));
  } catch (_) {
    return {};
  }
}

function saveSettingsFile(data) {
  try {
    fs.writeFileSync(SETTINGS_PATH(), JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Stash] No se pudo guardar settings.json:', err.message);
  }
}

// Atajo activo (mutable para permitir cambio en tiempo de ejecución)
let currentShortcut = loadSettingsFile().shortcut || 'Alt+Space';

// ── IPC: abre URL en el browser del sistema (para OAuth) ─────────────────────
ipcMain.handle('open-external', async (_event, targetUrl) => {
  await shell.openExternal(targetUrl);
});

// ── IPC: lanza un servidor HTTP one-shot para capturar el code de OAuth ───────
// Devuelve el puerto en el que escucha (aleatorio, ligado solo a loopback).
ipcMain.handle('start-auth-server', () => new Promise((resolve, reject) => {
  const server = http.createServer((req, res) => {
    const parsed = urlMod.parse(req.url, true);
    const code   = parsed.query.code;
    const error  = parsed.query.error;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    if (code) {
      res.end(`<!doctype html><html><head><title>Stash</title></head><body>
        <p style="font-family:system-ui;padding:40px;color:#1a1612;font-size:18px">
          ✓ Signed in! You can close this tab and return to Stash.
        </p>
        <script>setTimeout(()=>window.close(),800)</script>
      </body></html>`);
    } else {
      res.end(`<!doctype html><html><head><title>Stash</title></head><body>
        <p style="font-family:system-ui;padding:40px;color:#9a3a3a;font-size:18px">
          Auth failed: ${error || 'unknown error'}. You can close this tab.
        </p>
      </body></html>`);
    }

    server.close();

    // Envía el resultado al renderer via IPC
    if (mainWin && !mainWin.isDestroyed()) {
      mainWin.webContents.send('auth-callback', {
        code:  code  || null,
        error: error || null,
      });
    }
  });

  // Cierre automático si el usuario abandona el flujo OAuth (5 min)
  const timeout = setTimeout(() => {
    try { server.close(); } catch (_) {}
  }, 5 * 60 * 1000);

  server.on('close', () => clearTimeout(timeout));
  server.on('error', (err) => reject(err));

  // Puerto 0 = OS elige uno libre; solo loopback por seguridad
  server.listen(0, '127.0.0.1', () => {
    resolve(server.address().port);
  });
}));

// ── IPC: companion solicita ocultarse ─────────────────────────────────────────
ipcMain.on('companion-hide', () => {
  if (companionWin && !companionWin.isDestroyed()) companionWin.hide();
});

// ── IPC: abrir ventana de settings (desde la topbar del renderer) ─────────────
ipcMain.on('open-settings', () => {
  openSettingsWindow();
});

// ── IPC: settings solicita ocultarse ──────────────────────────────────────────
ipcMain.on('settings-hide', () => {
  if (settingsWin && !settingsWin.isDestroyed()) settingsWin.hide();
});

// ── IPC: leer settings actuales ───────────────────────────────────────────────
ipcMain.handle('get-settings', () => ({
  shortcut:    currentShortcut,
  openAtLogin: app.getLoginItemSettings().openAtLogin,
}));

// ── IPC: guardar settings ─────────────────────────────────────────────────────
ipcMain.handle('save-settings', (_e, { shortcut, openAtLogin }) => {
  // 1. Actualizar atajo del companion
  if (shortcut && shortcut !== currentShortcut) {
    globalShortcut.unregister(currentShortcut);
    const ok = globalShortcut.register(shortcut, companionToggle);
    if (!ok) {
      // Restaurar atajo anterior si el nuevo falla
      globalShortcut.register(currentShortcut, companionToggle);
      return { error: `El atajo "${shortcut}" no está disponible o ya está en uso.` };
    }
    currentShortcut = shortcut;
  }

  // 2. Auto-inicio con el sistema
  app.setLoginItemSettings({ openAtLogin: !!openAtLogin });

  // 3. Persistir en disco
  saveSettingsFile({ shortcut: currentShortcut });

  return { ok: true };
});

// ── Ventana principal ─────────────────────────────────────────────────────────
function createWindow() {
  mainWin = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 680,
    minHeight: 520,
    webPreferences: {
      // Needed so Babel standalone can load the .jsx files via XHR from file://
      webSecurity: false,
      contextIsolation: false,
      nodeIntegration: true,   // needed for ipcRenderer in renderer process
    },
    title: 'Stash',
    icon: path.join(__dirname, 'public', process.platform === 'win32' ? 'logo.ico' : 'logo.png'),
    backgroundColor: '#15130f', // dark bg por defecto para evitar flash blanco
  });

  // Ocultar la barra de menú en Windows/Linux
  mainWin.setMenuBarVisibility(false);

  mainWin.loadFile('Stash.html');

  // 'close' (cancelable): si no estamos saliendo de verdad, ocultar al tray
  mainWin.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWin.hide();
    }
  });

  // 'closed' (post-cierre real): limpiar todas las referencias
  mainWin.on('closed', () => {
    mainWin = null;
    if (companionWin && !companionWin.isDestroyed()) companionWin.destroy();
    if (tray && !tray.isDestroyed()) tray.destroy();
  });
}

// ── Ventana settings ──────────────────────────────────────────────────────────
function createSettingsWindow() {
  settingsWin = new BrowserWindow({
    width: 460,
    height: 320,
    frame: false,
    resizable: false,
    show: false,
    center: true,
    backgroundMaterial: 'acrylic',
    backgroundColor: '#00000000',
    skipTaskbar: true,
    webPreferences: {
      webSecurity: false,
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  settingsWin.loadFile('settings.html');

  settingsWin.on('blur', () => {
    if (settingsWin && !settingsWin.isDestroyed()) settingsWin.hide();
  });

  settingsWin.on('closed', () => { settingsWin = null; });
}

function openSettingsWindow() {
  if (!settingsWin || settingsWin.isDestroyed()) createSettingsWindow();
  settingsWin.show();
  settingsWin.focus();
}

// ── Ventana companion (Spotlight-style) ──────────────────────────────────────
function createCompanionWindow() {
  companionWin = new BrowserWindow({
    width: 500,
    height: 400,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    show: false,
    backgroundMaterial: 'acrylic',  // efecto vidrío esmerilado nativo en Windows 11 (Electron 30+)
    backgroundColor: '#00000000',  // fondo sin pintar = transparente; necesario para que backgroundMaterial funcione
    skipTaskbar: true,
    webPreferences: {
      webSecurity: false,
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  companionWin.loadFile('companion.html');

  // Ocultar automáticamente al perder el foco (clic fuera)
  companionWin.on('blur', () => {
    if (companionWin && !companionWin.isDestroyed()) companionWin.hide();
  });

  companionWin.on('closed', () => { companionWin = null; });
}

// ── System tray / menu bar ────────────────────────────────────────────────────
function createTray() {
  // Windows usa el ICO nativo; macOS/Linux redimensiona el PNG a 16x16 para el tray
  let icon;
  if (process.platform === 'win32') {
    icon = path.join(__dirname, 'public', 'logo.ico');
  } else {
    const img = nativeImage.createFromPath(path.join(__dirname, 'public', 'logo.png'));
    icon = img.resize({ width: 16, height: 16 });
  }

  tray = new Tray(icon);
  tray.setToolTip('Stash — tu librería de prompts');

  const menu = Menu.buildFromTemplate([
    {
      label: 'Abrir Stash',
      click: () => {
        if (mainWin) { mainWin.show(); mainWin.focus(); }
        else createWindow();
      },
    },
    {
      label: 'Configuración',
      click: () => openSettingsWindow(),
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => { isQuitting = true; app.quit(); },
    },
  ]);

  tray.setContextMenu(menu);

  // Windows: doble clic en el ícono del tray → mostrar ventana
  tray.on('double-click', () => {
    if (mainWin) { mainWin.show(); mainWin.focus(); }
  });
}

// ── Toggle companion (función nombrada para poder re-registrarla al cambiar atajo)
function companionToggle() {
  if (!companionWin || companionWin.isDestroyed()) return;

  if (companionWin.isVisible()) {
    companionWin.hide();
  } else {
    const cursor  = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursor);
    const { x, y, height } = display.workArea;
    companionWin.setPosition(
      Math.round(x + 24),
      Math.round(y + height - 400 - 24)
    );
    companionWin.show();
    companionWin.focus();
    companionWin.webContents.send('companion-refresh');
  }
}

app.setName('Stash');

app.whenReady().then(() => {
  createWindow();
  createCompanionWindow();
  createSettingsWindow();
  createTray();

  // ── Atajo global (dinámico): mostrar / ocultar companion ────────────────────
  // companionToggle se define aquí como función nombrada para poder reutilizarla
  // al cambiar el atajo desde la ventana de settings.
  const shortcutOk = globalShortcut.register(currentShortcut, companionToggle);

  if (!shortcutOk) {
    console.warn(`[Stash] No se pudo registrar el atajo "${currentShortcut}" (puede estar en uso).`);
  }

  // macOS: clic en el ícono del dock → mostrar si está oculta, crear si no existe
  app.on('activate', () => {
    if (mainWin) { mainWin.show(); mainWin.focus(); }
    else createWindow();
  });
});

// macOS: Cmd+Q dispara before-quit antes del evento 'close' de cada ventana
// → setear isQuitting para que el handler 'close' no cancele el cierre
app.on('before-quit', () => { isQuitting = true; });

// Liberar shortcuts al salir (obligatorio en Electron)
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// En Windows/Linux, cerrar todas las ventanas cierra la app
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
