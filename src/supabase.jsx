// src/supabase.jsx
// Inicializa el cliente de Supabase y lo expone en window._supabase
//
// Las credenciales vienen de src/config.jsx (gitignoreado).
// Para configurar: copia src/config.example.jsx → src/config.jsx y rellena tus claves.
// SEGURIDAD: La publishable key es pública por diseño — lo que protege los datos
// son las RLS policies de Supabase. Nunca uses la service_role key en código cliente.

const SUPABASE_URL  = (window.STASH_CONFIG || {}).supabaseUrl  || '';
const SUPABASE_ANON = (window.STASH_CONFIG || {}).supabaseKey || '';

let _supabase = null;

if (window.supabase && SUPABASE_URL && SUPABASE_ANON) {
  _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      storage: window.localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,  // el renderer nunca ve la URL de callback
      flowType: 'pkce',
    },
  });
} else if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn('[Stash] Credenciales no encontradas — copia src/config.example.jsx → src/config.jsx.');
} else {
  console.warn('[Stash] Supabase CDN no cargó — el modo cloud no estará disponible.');
}

Object.assign(window, { _supabase });
