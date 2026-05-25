import React, { useState, useEffect } from 'react';
import { ipc } from '@/lib/platform';
import { _supabase } from '@/supabase';

// ── Animación de spin para el icono de sync ──────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('stash-auth-anim')) {
  const s = document.createElement('style');
  s.id = 'stash-auth-anim';
  s.textContent = `
    @keyframes stashSpin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(s);
}

// ── Hook useAuth ─────────────────────────────────────────────────────────────
export function useAuth() {
  const [user,      setUser]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [syncing,   setSyncing]   = useState(false);
  const [lastSync,  setLastSync]  = useState(null);
  const [syncError, setSyncError] = useState(null);

  // Restaurar sesión al montar + suscribirse a cambios
  useEffect(() => {
    if (!_supabase) { setLoading(false); return; }

    _supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = _supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Escuchar el código OAuth enviado desde main.js via IPC
  useEffect(() => {
    if (!ipc || !_supabase) return;

    const handler = async (_event, { code, error }) => {
      if (error) {
        setSyncError(`Error de autenticación: ${error}`);
        return;
      }
      if (code) {
        const { error: exchErr } = await _supabase.auth.exchangeCodeForSession(code);
        if (exchErr) setSyncError(exchErr.message);
        // onAuthStateChange dispara automáticamente → setUser se actualiza
      }
    };

    ipc.on('auth-callback', handler);
    return () => ipc.removeListener('auth-callback', handler);
  }, [ipc]);

  // Iniciar login con Google
  const signIn = async () => {
    if (!_supabase) {
      setSyncError('Supabase no configurado. Revisa src/supabase.jsx');
      return;
    }
    setSyncError(null);
    try {
      if (ipc && typeof ipc.invoke === 'function') {
        // Modo Electron
        const port = await ipc.invoke('start-auth-server');
        const redirectTo = `http://127.0.0.1:${port}/callback`;

        const { data, error } = await _supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            skipBrowserRedirect: true,
          },
        });
        if (error) throw error;
        await ipc.invoke('open-external', data.url);
      } else {
        // Modo Web
        const { error } = await _supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
      }
    } catch (err) {
      setSyncError(err.message || 'Error al iniciar sesión');
    }
  };

  const signOut = async () => {
    if (!_supabase) return;
    await _supabase.auth.signOut();
    setLastSync(null);
    setSyncError(null);
  };

  return {
    user, loading,
    syncing, setSyncing,
    lastSync, setLastSync,
    syncError, setSyncError,
    signIn, signOut,
  };
}

// ── Componente AccountSection ─────────────────────────────────────────────────
export function AccountSection({ accent, user, loading, syncing, lastSync, syncError, signIn, signOut, onSync }) {
  const avatarUrl = user?.user_metadata?.avatar_url;
  const email     = user?.email ?? '';
  const name      = user?.user_metadata?.full_name || user?.user_metadata?.name || email;

  const fmtLastSync = (ts) => {
    if (!ts) return null;
    const diff = Math.round((Date.now() - ts) / 60000);
    if (diff < 1)  return 'just now';
    if (diff < 60) return `${diff} min ago`;
    return `${Math.round(diff / 60)}h ago`;
  };

  const sectionLabel = {
    fontSize: 11, letterSpacing: 0.7, color: 'var(--text-faint)',
    textTransform: 'uppercase', fontWeight: 600, padding: '4px 10px 8px',
  };

  const actionBtn = {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    padding: '5px 8px', borderRadius: 7, fontSize: 12.5, fontWeight: 500,
    background: 'var(--surface)', border: '1px solid var(--border-strong)',
    cursor: 'pointer', color: 'var(--text-2)', fontFamily: 'inherit',
    transition: 'background .1s',
  };

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      paddingTop: 14,
      paddingBottom: 6,
    }}>
      <div style={sectionLabel}>Account</div>

      {loading ? (
        <div style={{ padding: '6px 10px', fontSize: 12.5, color: 'var(--text-faint)' }}>
          Cargando…
        </div>
      ) : !_supabase ? (
        <div style={{ padding: '6px 10px', fontSize: 11.5, color: 'var(--text-faint)', lineHeight: 1.5 }}>
          Configura Supabase en{' '}
          <code style={{ fontSize: 10.5, background: 'var(--surface)', padding: '1px 4px', borderRadius: 3 }}>
            src/supabase.jsx
          </code>
        </div>
      ) : !user ? (
        <button
          onClick={signIn}
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            width: '100%', padding: '7px 10px', borderRadius: 8,
            background: 'transparent', border: '1px solid var(--border-strong)',
            cursor: 'pointer', fontSize: 13.5, fontWeight: 500,
            color: 'var(--text-2)', fontFamily: 'inherit',
            transition: 'background .12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover-2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: accent, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
              }}>
                {name[0]?.toUpperCase()}
              </div>
            )}
            <span style={{
              fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            }}>
              {name}
            </span>
          </div>

          <div style={{
            padding: '0 4px', fontSize: 12, color: 'var(--text-faint)',
            display: 'flex', alignItems: 'center', gap: 5, minHeight: 18,
          }}>
            {syncing ? (
              <>
                <span style={{ display: 'inline-block', animation: 'stashSpin 1s linear infinite' }}>↻</span>
                Syncing…
              </>
            ) : syncError ? (
              <span style={{ color: 'var(--danger)' }} title={syncError}>⚠ Sync error</span>
            ) : lastSync ? (
              <>☁ Synced {fmtLastSync(lastSync)}</>
            ) : (
              <>☁ Not yet synced</>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onSync}
              disabled={syncing}
              style={{ ...actionBtn, opacity: syncing ? 0.5 : 1, cursor: syncing ? 'not-allowed' : 'pointer' }}
            >
              ↕ Sync
            </button>
            <button onClick={signOut} style={actionBtn}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
