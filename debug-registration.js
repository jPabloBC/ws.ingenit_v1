// Script para debuggear problemas de registro
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://juupotamdjqzpxuqdtco.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dXBvdGFtZGpxenB4dXFkdGNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcwMjIxOCwiZXhwIjoyMDY1Mjc4MjE4fQ.qYlMzen6T8lSdaxhlngGlwrEoPMdSZp7StrGqEJ25Qo";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugRegistration() {
  console.log('🔍 Iniciando debug de registro...\n');

  // 1. Verificar conexión básica
  try {
    console.log('1. Verificando conexión a Supabase...');
    const { data, error } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Error de conexión:', error.message);
    } else {
      console.log('✅ Conexión exitosa');
    }
  } catch (e) {
    console.log('❌ Error de conexión:', e.message);
  }

  // 2. Verificar esquema ws_users
  try {
    console.log('\n2. Verificando tabla ws_users...');
    const { data, error } = await supabase.rpc('exec', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'app_ws' 
        AND table_name = 'ws_users'
        ORDER BY ordinal_position;
      `
    });
    
    if (error) {
      console.log('❌ Error obteniendo esquema ws_users:', error.message);
      // Intentar con query directa
      const { data: directData, error: directError } = await supabase
        .from('ws_users')
        .select('*')
        .limit(1);
      
      if (directError) {
        console.log('❌ Tabla ws_users no accesible:', directError.message);
      } else {
        console.log('✅ Tabla ws_users accesible via vista public');
      }
    } else {
      console.log('✅ Esquema ws_users:');
      console.table(data);
    }
  } catch (e) {
    console.log('❌ Error verificando ws_users:', e.message);
  }

  // 3. Verificar esquema ws_email_verifications
  try {
    console.log('\n3. Verificando tabla ws_email_verifications...');
    const { data, error } = await supabase
      .from('ws_email_verifications')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accediendo ws_email_verifications:', error.message);
    } else {
      console.log('✅ Tabla ws_email_verifications accesible');
      if (data && data.length > 0) {
        console.log('📊 Estructura de datos:', Object.keys(data[0]));
      }
    }
  } catch (e) {
    console.log('❌ Error verificando ws_email_verifications:', e.message);
  }

  // 4. Probar inserción simple en ws_users
  try {
    console.log('\n4. Probando inserción en ws_users...');
    
    // Generar datos de prueba
    const testData = {
      user_id: 'test-' + Date.now(),
      email: 'test@example.com',
      name: 'Test User',
      phone: '+56944344583',
      country_code: 'CL',
      country: 'Chile',
      currency_code: 'CLP',
      role: 'user',
      email_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('ws_users')
      .insert(testData)
      .select();
    
    if (error) {
      console.log('❌ Error insertando en ws_users:', error.message);
      console.log('📋 Detalle del error:', error);
    } else {
      console.log('✅ Inserción exitosa en ws_users');
      
      // Limpiar datos de prueba
      await supabase
        .from('ws_users')
        .delete()
        .eq('email', 'test@example.com');
      console.log('🧹 Datos de prueba eliminados');
    }
  } catch (e) {
    console.log('❌ Error en prueba de inserción:', e.message);
  }

  // 5. Probar creación de usuario en Auth
  try {
    console.log('\n5. Probando creación en Auth...');
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test-auth@example.com',
      password: 'TestPassword123!',
      user_metadata: {
        name: 'Test Auth User'
      }
    });
    
    if (error) {
      console.log('❌ Error creando usuario Auth:', error.message);
    } else {
      console.log('✅ Usuario Auth creado exitosamente');
      console.log('👤 ID del usuario:', data.user.id);
      
      // Limpiar usuario de prueba
      await supabase.auth.admin.deleteUser(data.user.id);
      console.log('🧹 Usuario de prueba eliminado');
    }
  } catch (e) {
    console.log('❌ Error en prueba Auth:', e.message);
  }

  console.log('\n🏁 Debug completado');
}

debugRegistration().catch(console.error);