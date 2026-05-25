// src/config.example.jsx — template committed to git
// To set up the project:
//   1. Copy this file → src/config.jsx
//   2. Fill in your Supabase credentials (Project Settings → API)
//   3. Never commit src/config.jsx — it's already in .gitignore

window.STASH_CONFIG = {
  supabaseUrl:  'YOUR_SUPABASE_PROJECT_URL',   // e.g. https://xxxx.supabase.co
  supabaseKey:  'YOUR_SUPABASE_ANON_KEY',      // sb_publishable_... or eyJ...
};
