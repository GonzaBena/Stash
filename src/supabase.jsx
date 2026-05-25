// src/supabase.jsx
// Inicializa el cliente de Supabase y lo expone en window._supabase
import { createClient } from '@supabase/supabase-js';

// Credenciales en orden de prioridad:
//   1. window.STASH_CONFIG  → src/config.jsx (local/Electron, gitignoreado)
//   2. import.meta.env      → variables VITE_SUPABASE_URL / VITE_SUPABASE_KEY
//                             (set en Netlify / Vercel / CI)
const SUPABASE_URL  = (window.STASH_CONFIG || {}).supabaseUrl  || import.meta.env.VITE_SUPABASE_URL  || '';
const SUPABASE_ANON = (window.STASH_CONFIG || {}).supabaseKey || import.meta.env.VITE_SUPABASE_KEY || '';

export let _supabase = null;

if (SUPABASE_URL && SUPABASE_ANON) {
  _supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      storage: window.localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,  // el renderer nunca ve la URL de callback
      flowType: 'pkce',
    },
  });
} else {
  console.warn('[Stash] Credenciales no encontradas o Supabase no configurado.');
}
