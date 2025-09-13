import { createClient } from '@supabase/supabase-js';

// Configuración directa
const supabaseUrl = "https://juupotamdjqzpxuqdtco.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dXBvdGFtZGpxenB4dXFkdGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDIyMTgsImV4cCI6MjA2NTI3ODIxOH0.8aXgTBg4vhs0DmTKPg9WGTvQ9hHBd_uCGHgt89ZfM_E";

// Crear una sola instancia global
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 