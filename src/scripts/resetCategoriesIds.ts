import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

/**
 * Script para reiniciar los IDs de ws_categories desde 1
 */
export async function resetCategoriesIds() {
  try {
    console.log('🔄 Iniciando reinicio de IDs de categorías...');

    // Paso 1: Obtener categorías actuales
    console.log('📊 Obteniendo categorías actuales...');
    const { data: currentCategories, error: fetchError } = await supabase
      .from('ws_categories')
      .select('*')
      .order('id', { ascending: true });

    if (fetchError) {
      console.error('❌ Error obteniendo categorías:', fetchError);
      return { success: false, error: fetchError };
    }

    if (!currentCategories || currentCategories.length === 0) {
      console.log('ℹ️ No hay categorías para reiniciar');
      return { success: true, message: 'No hay categorías para reiniciar' };
    }

    console.log(`📊 Encontradas ${currentCategories.length} categorías`);
    console.log(`📊 ID mínimo: ${Math.min(...currentCategories.map(c => c.id))}`);
    console.log(`📊 ID máximo: ${Math.max(...currentCategories.map(c => c.id))}`);

    // Paso 2: Crear mapeo de IDs viejos a nuevos
    console.log('🔄 Creando mapeo de IDs...');
    const idMapping = new Map();
    currentCategories.forEach((cat, index) => {
      idMapping.set(cat.id, index + 1); // Mapear ID viejo -> ID nuevo
    });

    console.log('📊 Mapeo de IDs:');
    idMapping.forEach((newId, oldId) => {
      console.log(`  ${oldId} -> ${newId}`);
    });

    // Paso 3: Crear tabla temporal
    console.log('🔄 Creando tabla temporal...');
    const { error: createTempError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE ws_categories_temp (
          id INTEGER PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          color VARCHAR(7) DEFAULT '#3B82F6',
          store_type VARCHAR(50),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    if (createTempError) {
      console.error('❌ Error creando tabla temporal:', createTempError);
      return { success: false, error: createTempError };
    }

    // Paso 4: Insertar datos en tabla temporal con nuevos IDs
    console.log('🔄 Insertando datos en tabla temporal...');
    const newCategories = currentCategories.map((cat, index) => ({
      id: index + 1, // Nuevos IDs desde 1
      name: cat.name,
      description: cat.description,
      color: cat.color,
      store_type: cat.store_type,
      created_at: cat.created_at,
      updated_at: cat.updated_at
    }));

    const { error: insertError } = await supabase
      .from('ws_categories_temp')
      .insert(newCategories);

    if (insertError) {
      console.error('❌ Error insertando en tabla temporal:', insertError);
      return { success: false, error: insertError };
    }

    // Paso 5: Actualizar referencias en ws_products
    console.log('🔄 Actualizando referencias en ws_products...');
    const { data: products, error: productsError } = await supabase
      .from('ws_products')
      .select('id, category_id');

    if (productsError) {
      console.log('ℹ️ No se pudo obtener productos o tabla no existe');
    } else if (products && products.length > 0) {
      // Actualizar referencias usando el mapeo ya creado
      let updatedCount = 0;
      for (const product of products) {
        if (product.category_id) {
          const oldId = parseInt(product.category_id);
          const newId = idMapping.get(oldId);
          
          if (newId) {
            const { error: updateError } = await supabase
              .from('ws_products')
              .update({ category_id: newId.toString() })
              .eq('id', product.id);

            if (updateError) {
              console.error(`❌ Error actualizando producto ${product.id}:`, updateError);
            } else {
              updatedCount++;
            }
          }
        }
      }
      console.log(`✅ Referencias en ws_products actualizadas: ${updatedCount} productos`);
    }

    // Paso 6: Eliminar tabla original y renombrar
    console.log('🔄 Eliminando tabla original y renombrando...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE ws_categories CASCADE;'
    });

    if (dropError) {
      console.error('❌ Error eliminando tabla original:', dropError);
    }

    const { error: renameError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE ws_categories_temp RENAME TO ws_categories;'
    });

    if (renameError) {
      console.error('❌ Error renombrando tabla:', renameError);
      return { success: false, error: renameError };
    }

    // Paso 7: Recrear índices
    console.log('🔄 Recreando índices...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_ws_categories_store_type ON ws_categories(store_type);
        CREATE INDEX IF NOT EXISTS idx_ws_categories_name ON ws_categories(name);
      `
    });

    if (indexError) {
      console.error('❌ Error creando índices:', indexError);
    }

    // Verificar resultado
    const { data: finalCategories, error: finalError } = await supabase
      .from('ws_categories')
      .select('id, name, store_type')
      .order('id', { ascending: true });

    if (finalError) {
      console.error('❌ Error verificando resultado:', finalError);
      return { success: false, error: finalError };
    }

    console.log('✅ Reinicio de IDs completado exitosamente');
    console.log('📊 Categorías finales:', finalCategories);

    return { 
      success: true, 
      message: `IDs reiniciados desde 1. Total: ${finalCategories?.length || 0} categorías`,
      categories: finalCategories 
    };

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return { success: false, error };
  }
}

// Función para ejecutar desde la consola del navegador
export function runResetCategoriesIds() {
  return resetCategoriesIds();
}
