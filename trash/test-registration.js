// Test simple de registro
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://juupotamdjqzpxuqdtco.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dXBvdGFtZGpxenB4dXFkdGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDIyMTgsImV4cCI6MjA2NTI3ODIxOH0.8aXgTBg4vhs0DmTKPg9WGTvQ9hHBd_uCGHgt89ZfM_E";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dXBvdGFtZGpxenB4dXFkdGNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcwMjIxOCwiZXhwIjoyMDY1Mjc4MjE4fQ.qYlMzen6T8lSdaxhlngGlwrEoPMdSZp7StrGqEJ25Qo";

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testRegistration() {
  console.log('🧪 Simulando proceso de registro...\n');

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Test User';

  try {
    // 1. Crear usuario en Auth
    console.log('1. Creando usuario en Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: testName,
          phone: '+56944344583',
          country: 'Chile',
          countryCode: 'CL',
          currencyCode: 'CLP'
        }
      }
    });

    if (authError) {
      console.log('❌ Error en Auth:', authError.message);
      return;
    }

    if (!authData.user) {
      console.log('❌ No se creó el usuario en Auth');
      return;
    }

    console.log('✅ Usuario creado en Auth:', authData.user.id);

    // 2. Crear perfil en ws_users
    console.log('\n2. Creando perfil en ws_users...');
    
    const profileData = {
      user_id: authData.user.id, // Este debería ser un UUID válido
      email: testEmail.toLowerCase(),
      name: testName,
      phone: '+56944344583',
      country_code: 'CL',
      country: 'Chile',
      currency_code: 'CLP',
      role: 'user',
      email_verified: false,
      app_id: '550e8400-e29b-41d4-a716-446655440000', // UUID por defecto para la aplicación
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📋 Datos del perfil:', {
      user_id: profileData.user_id,
      email: profileData.email,
      name: profileData.name
    });

    const { data: profileInsert, error: profileError } = await supabase
      .from('ws_users')
      .insert(profileData)
      .select();

    if (profileError) {
      console.log('❌ Error insertando perfil:', profileError.message);
      console.log('📋 Detalle:', profileError);
    } else {
      console.log('✅ Perfil creado exitosamente');
    }

    // 3. Crear verificación de email
    console.log('\n3. Creando verificación de email...');
    
    const verificationToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const verificationData = {
      user_id: authData.user.id,
      email: testEmail.toLowerCase(),
      verified: false,
      verification_token: verificationToken,
      created_at: new Date().toISOString()
    };

    const { error: verificationError } = await supabase
      .from('ws_email_verifications')
      .insert(verificationData);

    if (verificationError) {
      console.log('❌ Error creando verificación:', verificationError.message);
    } else {
      console.log('✅ Verificación creada exitosamente');
    }

    // 4. Limpiar datos de prueba
    console.log('\n4. Limpiando datos de prueba...');
    
    // Eliminar de ws_users
    await supabase
      .from('ws_users')
      .delete()
      .eq('email', testEmail);

    // Eliminar de ws_email_verifications
    await supabase
      .from('ws_email_verifications')
      .delete()
      .eq('email', testEmail);

    // Eliminar usuario de Auth (requiere service key)
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

    console.log('🧹 Datos de prueba eliminados');

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }

  console.log('\n🏁 Test completado');
}

testRegistration().catch(console.error);