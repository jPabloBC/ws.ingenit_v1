// Reutilizar el singleton principal para evitar múltiples instancias de GoTrueClient.
// Se mantiene este archivo para compatibilidad con imports existentes.
import { supabase } from './client';

export const supabaseRegister = supabase;

// Nota: Si se necesitan opciones específicas de signUp, configúrelas en la llamada
// (por ejemplo, supabase.auth.signUp({ ..., options: { emailRedirectTo: ... } }))