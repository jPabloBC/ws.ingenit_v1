import { createClient } from '@supabase/supabase-js';

// Configuración directa para evitar problemas de caché
const supabaseUrl = "https://juupotamdjqzpxuqdtco.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dXBvdGFtZGpxenB4dXFkdGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDIyMTgsImV4cCI6MjA2NTI3ODIxOH0.8aXgTBg4vhs0DmTKPg9WGTvQ9hHBd_uCGHgt89ZfM_E";

// Variable global para almacenar la instancia
let supabaseClient: any = null;

export const supabase = (() => {
  if (supabaseClient) {
    return supabaseClient;
  }
  
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web'
      }
    }
  });
  
  return supabaseClient;
})();

// TypeScript declarations for environment variables
declare global {
  interface ImportMetaEnv {
    readonly NEXT_PUBLIC_SUPABASE_URL: string;
    readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  }
} 