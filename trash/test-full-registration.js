// Test completo del flujo de registro
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://juupotamdjqzpxuqdtco.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dXBvdGFtZGpxenB4dXFkdGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDIyMTgsImV4cCI6MjA2NTI3ODIxOH0.8aXgTBg4vhs0DmTKPg9WGTvQ9hHBd_uCGHgt89ZfM_E";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dXBvdGFtZGpxenB4dXFkdGNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcwMjIxOCwiZXhwIjoyMDY1Mjc4MjE4fQ.qYlMzen6T8lSdaxhlngGlwrEoPMdSZp7StrGqEJ25Qo";

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fullRegistrationTest() {
  const testEmail = `test-full-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Full Test User';
  
  console.log('🧪 PRUEBA COMPLETA DEL REGISTRO\n');
  console.log(`📧 Email de prueba: ${testEmail}\n`);

  try {
    // Paso 1: Registro en Auth
    console.log('1️⃣ Registrando usuario en Auth...');
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
      return false;
    }

    if (!authData.user) {
      console.log('❌ No se creó el usuario en Auth');
      return false;
    }

    console.log('✅ Usuario creado en Auth:', authData.user.id);

    // Paso 2: Crear perfil en ws_users
    console.log('\n2️⃣ Creando perfil en ws_users...');
    const profileData = {
      user_id: authData.user.id,
      email: testEmail.toLowerCase(),
      name: testName,
      phone: '+56944344583',
      country_code: 'CL',
      country: 'Chile',
      currency_code: 'CLP',
      role: 'user',
      email_verified: false,
      app_id: '550e8400-e29b-41d4-a716-446655440000',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: profileError } = await supabase
      .from('ws_users')
      .insert(profileData);

    if (profileError) {
      console.log('❌ Error creando perfil:', profileError.message);
      return false;
    }

    console.log('✅ Perfil creado exitosamente');

    // Paso 3: Crear verificación de email
    console.log('\n3️⃣ Creando verificación de email...');
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
      return false;
    }

    console.log('✅ Verificación creada exitosamente');

    // Paso 4: Verificar que los datos se insertaron correctamente
    console.log('\n4️⃣ Verificando datos insertados...');
    
    // Verificar perfil
    const { data: profile, error: profileCheckError } = await supabase
      .from('ws_users')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (profileCheckError) {
      console.log('❌ Error verificando perfil:', profileCheckError.message);
      return false;
    }

    console.log('✅ Perfil verificado:', {
      email: profile.email,
      name: profile.name,
      country: profile.country,
      app_id: profile.app_id
    });

    // Verificar verificación
    const { data: verification, error: verificationCheckError } = await supabase
      .from('ws_email_verifications')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (verificationCheckError) {
      console.log('❌ Error verificando registro de verificación:', verificationCheckError.message);
      return false;
    }

    console.log('✅ Verificación registrada:', {
      email: verification.email,
      verified: verification.verified,
      token: verification.verification_token.substring(0, 20) + '...'
    });

    // Paso 5: Simular verificación de email
    console.log('\n5️⃣ Simulando verificación de email...');
    const { error: updateError } = await supabase
      .from('ws_email_verifications')
      .update({
        verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('verification_token', verificationToken);

    if (updateError) {
      console.log('❌ Error actualizando verificación:', updateError.message);
      return false;
    }

    console.log('✅ Email verificado exitosamente');

    // Paso 6: Limpiar datos de prueba
    console.log('\n6️⃣ Limpiando datos de prueba...');
    
    await supabase.from('ws_users').delete().eq('email', testEmail);
    await supabase.from('ws_email_verifications').delete().eq('email', testEmail);
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

    console.log('🧹 Datos de prueba eliminados');

    console.log('\n🎉 ¡REGISTRO COMPLETO EXITOSO!');
    console.log('✅ Todos los pasos funcionaron correctamente');
    
    return true;

  } catch (error) {
    console.log('\n❌ Error en la prueba:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Iniciando pruebas del sistema de registro...\n');
  
  const success = await fullRegistrationTest();
  
  if (success) {
    console.log('\n🎯 RESULTADO: ¡El sistema de registro está funcionando correctamente!');
    console.log('✅ Los usuarios pueden registrarse sin problemas');
  } else {
    console.log('\n❌ RESULTADO: Hay problemas en el sistema de registro');
    console.log('🔧 Revisa los errores anteriores para más detalles');
  }
}

runTests().catch(console.error);