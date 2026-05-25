// src/lib/platform.js

export const isElectron = typeof window !== 'undefined' && 
                           window.process && 
                           window.process.type === 'renderer';

// Abstracción de IPC para que no falle en la web
export const ipc = isElectron ? window.require('electron').ipcRenderer : {
  send: () => {},
  on: () => {},
  removeListener: () => {},
  invoke: async () => ({ error: 'IPC no disponible en web' }),
};

// Abstracción de apertura de URLs
export const openExternal = async (url) => {
  if (isElectron) {
    return await ipc.invoke('open-external', url);
  } else {
    window.open(url, '_blank');
  }
};
