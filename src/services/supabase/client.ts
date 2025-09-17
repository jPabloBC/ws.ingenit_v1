import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuración directa: usar env si están disponibles
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://juupotamdjqzpxuqdtco.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dXBvdGFtZGpxenB4dXFkdGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDIyMTgsImV4cCI6MjA2NTI3ODIxOH0.8aXgTBg4vhs0DmTKPg9WGTvQ9hHBd_uCGHgt89ZfM_E';

const DEBUG_SUPABASE = process.env.NEXT_PUBLIC_DEBUG_SUPABASE === 'true';

// Tipar globalThis para evitar TS errors (solo en runtime browser + HMR)
declare global {
  // eslint-disable-next-line no-var
  var __INGENIT_SUPABASE__: SupabaseClient | undefined;
}

let creating = false; // evita reentradas concurrentes raras

export const getSupabaseClient = (): SupabaseClient => {
  // Reutilizar si ya existe
  if (globalThis.__INGENIT_SUPABASE__) return globalThis.__INGENIT_SUPABASE__;
  // Evitar doble construcción durante StrictMode mount/unmount rápido
  if (creating) {
    if (DEBUG_SUPABASE) console.warn('[Supabase] Creation in progress, reusing pending placeholder');
    // Mientras tanto devolver una referencia temporal (sin crear nueva) si existiera
    if (globalThis.__INGENIT_SUPABASE__) return globalThis.__INGENIT_SUPABASE__;
  }
  creating = true;
  if (DEBUG_SUPABASE) console.log('[Supabase] 🔧 Initializing singleton (lazy)');
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: typeof window === 'undefined' ? undefined : {
        getItem: (key: string) => {
          const data = localStorage.getItem(key);
          if (DEBUG_SUPABASE) console.log('[Supabase][storage] get', key, data ? '✓' : '∅');
          return data || null;
        },
        setItem: (key: string, value: string) => {
          if (DEBUG_SUPABASE) console.log('[Supabase][storage] set', key, 'len:', value.length);
          localStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          if (DEBUG_SUPABASE) console.log('[Supabase][storage] remove', key);
          localStorage.removeItem(key);
        }
      }
    }
  });
  globalThis.__INGENIT_SUPABASE__ = client;
  creating = false;
  if (DEBUG_SUPABASE) console.log('[Supabase] ✅ Singleton ready');
  return client;
};

// Export nombrado en vez de crear inmediatamente para reducir instancias en transpilación/HMR
export const supabase: SupabaseClient = getSupabaseClient();

// Nota: No registrar listeners aquí; AuthContext gestionará onAuthStateChange una sola vez.