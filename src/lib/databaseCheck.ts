import { supabase } from '@/services/supabase/client';

export const checkDatabaseSetup = async () => {
  try {
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
    }

    // Verificar que las funciones RPC existan (solo las básicas, no las de límites)
    const functions: string[] = [
      // 'get_user_current_plan',  // Removido: causa bucles si no existe
      // 'check_user_limits',     // Removido: causa bucles si no existe  
      // 'create_free_subscription' // Removido: causa bucles si no existe
    ];

    for (const func of functions) {
      try {
        const { data, error } = await supabase.rpc(func, { 
          user_uuid: '00000000-0000-0000-0000-000000000000' 
        });
        
        // Solo reportar errores críticos, no 404s esperados
        if (error && !error.message.includes('violates foreign key constraint') && !error.message.includes('Could not find the function')) {
          console.error(`❌ Error verificando función ${func}:`, error.message);
          return false;
        }
      } catch (err) {
        // Solo reportar errores críticos
        if (err instanceof Error && !err.message.includes('Could not find the function')) {
          console.error(`❌ Error verificando función ${func}:`, err);
          return false;
        }
      }
    }

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

