import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

/**
 * Script simplificado para migrar categorías a UUID
 * Asume que la tabla ws_categories ya existe con estructura UUID
 */
export async function simpleMigrateCategories() {
  try {
    console.log('🔄 Iniciando migración simple de categorías...');

    // Verificar si la tabla existe
    const { data: categories, error: fetchError } = await supabase
      .from('ws_categories')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.error('❌ Error accediendo a ws_categories:', fetchError);
      return { success: false, error: fetchError };
    }

    console.log('✅ Tabla ws_categories accesible');

    // Verificar si ya tiene categorías
    const { data: allCategories, error: allError } = await supabase
      .from('ws_categories')
      .select('*');

    if (allError) {
      console.error('❌ Error obteniendo categorías:', allError);
      return { success: false, error: allError };
    }

    if (allCategories && allCategories.length > 0) {
      console.log(`ℹ️ Ya existen ${allCategories.length} categorías`);
      return { 
        success: true, 
        message: `Ya existen ${allCategories.length} categorías`,
        categories: allCategories 
      };
    }

    // Insertar categorías por defecto
    console.log('🔄 Insertando categorías por defecto...');
    const defaultCategories = [
      { name: 'General', description: 'Categoría general para productos', color: '#3B82F6', store_type: 'retail' },
      { name: 'Bebidas', description: 'Bebidas y líquidos', color: '#10B981', store_type: 'retail' },
      { name: 'Snacks', description: 'Snacks y aperitivos', color: '#F59E0B', store_type: 'retail' },
      { name: 'Limpieza', description: 'Productos de limpieza', color: '#8B5CF6', store_type: 'retail' },
      { name: 'Electrónicos', description: 'Dispositivos electrónicos', color: '#EF4444', store_type: 'retail' },
      { name: 'Ropa', description: 'Prendas de vestir', color: '#06B6D4', store_type: 'retail' },
      { name: 'Hogar', description: 'Artículos para el hogar', color: '#84CC16', store_type: 'retail' },
      { name: 'Deportes', description: 'Artículos deportivos', color: '#F97316', store_type: 'retail' },
      { name: 'Libros', description: 'Libros y material educativo', color: '#6366F1', store_type: 'retail' },
      { name: 'Juguetes', description: 'Juguetes y entretenimiento', color: '#EC4899', store_type: 'retail' }
    ];

    const { data: insertedCategories, error: insertError } = await supabase
      .from('ws_categories')
      .insert(defaultCategories)
      .select();

    if (insertError) {
      console.error('❌ Error insertando categorías:', insertError);
      return { success: false, error: insertError };
    }

    console.log(`✅ Insertadas ${insertedCategories?.length || 0} categorías por defecto`);

    return { 
      success: true, 
      message: `Insertadas ${insertedCategories?.length || 0} categorías`,
      categories: insertedCategories 
    };

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return { success: false, error };
  }
}

// Función para ejecutar desde la consola del navegador
export function runSimpleMigrateCategories() {
  return simpleMigrateCategories();
}
