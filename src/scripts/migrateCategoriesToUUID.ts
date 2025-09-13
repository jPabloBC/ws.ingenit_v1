import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

/**
 * Script para migrar la tabla ws_categories de SERIAL a UUID
 */
export async function migrateCategoriesToUUID() {
  try {
    console.log('🔄 Iniciando migración de ws_categories a UUID...');

    // Paso 1: Verificar si la tabla existe y obtener su estructura
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'ws_categories')
      .eq('table_schema', 'public');

    if (tableError) {
      console.error('❌ Error verificando tabla:', tableError);
      return { success: false, error: tableError };
    }

    if (!tableInfo || tableInfo.length === 0) {
      console.log('ℹ️ Tabla ws_categories no existe, creando nueva con UUID...');
      return await createNewCategoriesTable();
    }

    // Verificar si ya es UUID
    const idColumn = tableInfo.find(col => col.column_name === 'id');
    if (idColumn?.data_type === 'uuid') {
      console.log('✅ La tabla ya usa UUID');
      return { success: true, message: 'Tabla ya usa UUID' };
    }

    console.log('📊 Estructura actual de la tabla:', tableInfo);

    // Paso 2: Crear tabla temporal usando SQL directo
    console.log('🔄 Creando tabla temporal...');
    
    // Nota: Para crear tablas necesitamos usar el SQL Editor de Supabase
    // Este script asume que la tabla temporal ya existe o se creará manualmente
    console.log('ℹ️ Para crear la tabla temporal, ejecuta este SQL en Supabase SQL Editor:');
    console.log(`
      CREATE TABLE IF NOT EXISTS ws_categories_new (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        store_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Paso 3: Migrar datos existentes
    console.log('🔄 Migrando datos existentes...');
    const { data: existingCategories, error: fetchError } = await supabase
      .from('ws_categories')
      .select('*');

    if (fetchError) {
      console.error('❌ Error obteniendo categorías existentes:', fetchError);
      return { success: false, error: fetchError };
    }

    if (existingCategories && existingCategories.length > 0) {
      const { error: insertError } = await supabase
        .from('ws_categories_new')
        .insert(existingCategories.map(cat => ({
          name: cat.name,
          description: cat.description,
          color: cat.color || '#3B82F6',
          store_type: cat.store_type,
          created_at: cat.created_at,
          updated_at: cat.updated_at
        })));

      if (insertError) {
        console.error('❌ Error insertando datos en tabla temporal:', insertError);
        return { success: false, error: insertError };
      }

      console.log(`✅ Migrados ${existingCategories.length} registros`);
    }

    // Paso 4: Actualizar referencias en ws_products
    console.log('🔄 Actualizando referencias en ws_products...');
    const { data: products, error: productsError } = await supabase
      .from('ws_products')
      .select('id, category_id');

    if (productsError) {
      console.log('ℹ️ No se pudo obtener productos o tabla no existe');
    } else if (products && products.length > 0) {
      // Crear mapeo de IDs viejos a nuevos
      const { data: mapping, error: mappingError } = await supabase
        .from('ws_categories')
        .select('id, name')
        .then(async (oldCats) => {
          if (oldCats.error) return oldCats;
          
          const { data: newCats, error: newCatsError } = await supabase
            .from('ws_categories_new')
            .select('id, name');
          
          if (newCatsError) return { data: null, error: newCatsError };
          
          const mapping = oldCats.data.map(oldCat => {
            const newCat = newCats?.find(nc => nc.name === oldCat.name);
            return { oldId: oldCat.id, newId: newCat?.id };
          }).filter(m => m.newId);
          
          return { data: mapping, error: null };
        });

      if (mappingError) {
        console.error('❌ Error creando mapeo:', mappingError);
      } else if (mapping) {
        // Actualizar referencias
        for (const map of mapping) {
          const { error: updateError } = await supabase
            .from('ws_products')
            .update({ category_id: map.newId })
            .eq('category_id', map.oldId);

          if (updateError) {
            console.error(`❌ Error actualizando producto con category_id ${map.oldId}:`, updateError);
          }
        }
        console.log('✅ Referencias en ws_products actualizadas');
      }
    }

    // Paso 5: Eliminar tabla original y renombrar
    console.log('🔄 Eliminando tabla original y renombrando...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS ws_categories CASCADE;'
    });

    if (dropError) {
      console.error('❌ Error eliminando tabla original:', dropError);
    }

    const { error: renameError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE ws_categories_new RENAME TO ws_categories;'
    });

    if (renameError) {
      console.error('❌ Error renombrando tabla:', renameError);
      return { success: false, error: renameError };
    }

    // Paso 6: Crear índices y triggers
    console.log('🔄 Creando índices y triggers...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_ws_categories_store_type ON ws_categories(store_type);
        CREATE INDEX IF NOT EXISTS idx_ws_categories_name ON ws_categories(name);
      `
    });

    if (indexError) {
      console.error('❌ Error creando índices:', indexError);
    }

    // Paso 7: Insertar categorías por defecto
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

    const { error: insertDefaultError } = await supabase
      .from('ws_categories')
      .upsert(defaultCategories, { onConflict: 'name,store_type' });

    if (insertDefaultError) {
      console.error('❌ Error insertando categorías por defecto:', insertDefaultError);
    } else {
      console.log('✅ Categorías por defecto insertadas');
    }

    // Verificar resultado
    const { data: finalCategories, error: finalError } = await supabase
      .from('ws_categories')
      .select('id, name, store_type')
      .limit(5);

    if (finalError) {
      console.error('❌ Error verificando resultado:', finalError);
      return { success: false, error: finalError };
    }

    console.log('✅ Migración completada exitosamente');
    console.log('📊 Categorías finales:', finalCategories);

    return { 
      success: true, 
      message: 'Migración completada',
      categories: finalCategories 
    };

  } catch (error) {
    console.error('❌ Error inesperado en migración:', error);
    return { success: false, error };
  }
}

async function createNewCategoriesTable() {
  try {
    console.log('🔄 Creando nueva tabla ws_categories con UUID...');
    
    // Crear tabla directamente
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS ws_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          color VARCHAR(7) DEFAULT '#3B82F6',
          store_type VARCHAR(50),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_ws_categories_store_type ON ws_categories(store_type);
        CREATE INDEX IF NOT EXISTS idx_ws_categories_name ON ws_categories(name);
      `
    });

    if (createError) {
      console.error('❌ Error creando tabla:', createError);
      return { success: false, error: createError };
    }

    // Insertar categorías por defecto
    const defaultCategories = [
      { name: 'General', description: 'Categoría general para productos', color: '#3B82F6', store_type: 'retail' },
      { name: 'Bebidas', description: 'Bebidas y líquidos', color: '#10B981', store_type: 'retail' },
      { name: 'Snacks', description: 'Snacks y aperitivos', color: '#F59E0B', store_type: 'retail' },
      { name: 'Limpieza', description: 'Productos de limpieza', color: '#8B5CF6', store_type: 'retail' },
      { name: 'Electrónicos', description: 'Dispositivos electrónicos', color: '#EF4444', store_type: 'retail' }
    ];

    const { error: insertError } = await supabase
      .from('ws_categories')
      .insert(defaultCategories);

    if (insertError) {
      console.error('❌ Error insertando categorías por defecto:', insertError);
      return { success: false, error: insertError };
    }

    console.log('✅ Nueva tabla ws_categories creada con UUID');
    return { success: true, message: 'Nueva tabla creada con UUID' };

  } catch (error) {
    console.error('❌ Error creando nueva tabla:', error);
    return { success: false, error };
  }
}

// Función para ejecutar desde la consola del navegador
export function runMigrateCategoriesToUUID() {
  return migrateCategoriesToUUID();
}
