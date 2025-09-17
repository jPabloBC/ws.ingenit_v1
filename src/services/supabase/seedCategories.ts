import { supabase } from './client';

// Lista mínima de categorías base (puedes ajustar o ampliar)
const BASE_CATEGORIES: Array<{ name: string; description: string; color: string }> = [
  { name: 'General', description: 'Productos generales', color: '#6366F1' },
  { name: 'Sin Clasificar', description: 'Productos sin categoría específica', color: '#6B7280' },
  { name: 'Promociones', description: 'Productos en oferta o campaña', color: '#F59E0B' }
];

/**
 * Inserta categorías base si no existen categorías para el store_type dado.
 * Retorna true si sembró, false si ya había.
 */
export async function ensureDefaultCategories(storeType: string): Promise<boolean> {
  if (!storeType) return false;
  // Contar existentes
  const { count, error: countError } = await supabase
    .from('ws_categories')
    .select('id', { count: 'exact', head: true })
    .eq('store_type', storeType);

  if (countError) {
    console.warn('[seedCategories] No se pudo contar categorías:', countError.message);
    return false;
  }
  if ((count || 0) > 0) return false; // ya existen

  const rows = BASE_CATEGORIES.map(c => ({ ...c, store_type: storeType }));
  const { error: insertError } = await supabase.from('ws_categories').insert(rows);
  if (insertError) {
    console.error('[seedCategories] Error insertando categorías base:', insertError.message);
    return false;
  }
  console.log(`[seedCategories] Sembradas ${rows.length} categorías base para store_type=${storeType}`);
  return true;
}
