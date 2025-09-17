import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Evitar múltiples instancias admin que generan warning de GoTrueClient en dev/HMR
declare global { // eslint-disable-line no-var
  var __INGENIT_SUPABASE_ADMIN__: SupabaseClient | undefined;
}

const serviceUrl = 'https://juupotamdjqzpxuqdtco.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dXBvdGFtZGpxenB4dXFkdGNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcwMjIxOCwiZXhwIjoyMDY1Mjc4MjE4fQ.qYlMzen6T8lSdaxhlngGlwrEoPMdSZp7StrGqEJ25Qo';

function createAdminSingleton(): SupabaseClient {
  // Advertencia si se usa en browser - solo debería usarse en servidor
  if (typeof window !== 'undefined') {
    console.warn('⚠️ supabaseAdmin usado en browser - puede causar múltiples instancias GoTrueClient');
  }
  
  if (globalThis.__INGENIT_SUPABASE_ADMIN__) return globalThis.__INGENIT_SUPABASE_ADMIN__;
  const client = createClient(serviceUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: 'implicit',
      // Usar storage inerte + storageKey distinto para evitar choque con cliente público
      storageKey: 'sb-admin-noauth',
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      }
    },
    global: {
      headers: { 'X-Client-Info': 'supabase-js-admin-singleton' }
    }
  });
  globalThis.__INGENIT_SUPABASE_ADMIN__ = client;
  return client;
}

export const supabaseAdmin = createAdminSingleton();
