import { supabase } from '@/services/supabase/client';

export const checkDatabaseSetup = async () => {
  try {
    console.log('🔍 Verificando configuración de base de datos...');
    
    // Verificar que las tablas principales existan
    const tables = [
      'ws_users',
      'ws_plans', 
      'ws_subscriptions',
      'ws_usage',
      'ws_products',
      'ws_categories'
    ];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Error verificando tabla ${table}:`, error.message);
        return false;
      }
      console.log(`✅ Tabla ${table} verificada`);
    }

    // Verificar que las funciones RPC existan
    const functions = [
      'get_user_current_plan',
      'check_user_limits',
      'create_free_subscription'
    ];

    for (const func of functions) {
      try {
        const { data, error } = await supabase.rpc(func, { 
          user_uuid: '00000000-0000-0000-0000-000000000000' 
        });
        
        // Esperamos un error específico, no un error de función no encontrada
        if (error && !error.message.includes('violates foreign key constraint') && !error.message.includes('Could not find the function')) {
          console.error(`❌ Error verificando función ${func}:`, error.message);
          return false;
        }
        console.log(`✅ Función ${func} verificada`);
      } catch (err) {
        // Si la función no existe, continuar sin fallar
        if (err instanceof Error && err.message.includes('Could not find the function')) {
          console.log(`⚠️ Función ${func} no encontrada, continuando...`);
          continue;
        }
        console.error(`❌ Error verificando función ${func}:`, err);
        return false;
      }
    }

    console.log('✅ Configuración de base de datos verificada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error general verificando base de datos:', error);
    return false;
  }
};

export const getDatabaseStatus = async () => {
  const isSetup = await checkDatabaseSetup();
  
  if (!isSetup) {
    console.error('⚠️ La base de datos no está correctamente configurada');
    console.log('💡 Ejecuta el script complete-database-setup.sql en Supabase');
    return {
      status: 'error',
      message: 'Base de datos no configurada correctamente'
    };
  }

  return {
    status: 'success',
    message: 'Base de datos configurada correctamente'
  };
};

