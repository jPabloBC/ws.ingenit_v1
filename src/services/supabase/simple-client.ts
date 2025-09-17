// Reutilización del singleton principal para evitar instancias duplicadas.
// Este archivo se conserva para compatibilidad con imports previos.
import { supabase } from './client';

export const supabaseSimple = supabase;

// Para debug, use directamente funciones del cliente singleton.
