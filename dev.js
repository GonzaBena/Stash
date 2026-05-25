// dev.js — arranca Vite y luego Electron cuando Vite esté listo
const { spawn } = require('child_process');

const VITE_DELAY_MS = 3000; // tiempo que le damos a Vite para arrancar

// 1. Arranca Vite en background
const vite = spawn('pnpm', ['run', 'web'], {
  stdio: 'inherit',
  shell: true,
  detached: false,
});

vite.on('error', (err) => {
  console.error('[dev] Error al arrancar Vite:', err.message);
  process.exit(1);
});

vite.on('close', (code) => {
  if (code !== null && code !== 0) {
    console.error(`[dev] Vite salió con código ${code}`);
  }
});

// 2. Después de VITE_DELAY_MS arrancar Electron, pasándole la URL de Vite
setTimeout(() => {
  console.log('[dev] Arrancando Electron → http://localhost:3000');

  const electron = spawn('pnpm', ['start'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ELECTRON_START_URL: 'http://localhost:3000' },
  });

  electron.on('error', (err) => {
    console.error('[dev] Error al arrancar Electron:', err.message);
    vite.kill();
    process.exit(1);
  });

  electron.on('close', () => {
    vite.kill();
    process.exit(0);
  });
}, VITE_DELAY_MS);

process.on('SIGINT',  () => { vite.kill(); process.exit(0); });
process.on('SIGTERM', () => { vite.kill(); process.exit(0); });
