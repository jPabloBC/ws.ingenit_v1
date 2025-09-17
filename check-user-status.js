// Script para verificar el estado del usuario jpalebe@hotmail.com
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://juupotamdjqzpxuqdtco.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dXBvdGFtZGpxenB4dXFkdGNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcwMjIxOCwiZXhwIjoyMDY1Mjc4MjE4fQ.qYlMzen6T8lSdaxhlngGlwrEoPMdSZp7StrGqEJ25Qo";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserStatus() {
  const email = 'jpalebe@hotmail.com';
  console.log(`🔍 Verificando estado del usuario: ${email}\n`);

  try {
    // 1. Verificar en Auth
    console.log('1️⃣ Verificando en Supabase Auth...');
    const { data: users, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error obteniendo usuarios de Auth:', authError.message);
    } else {
      const user = users.users.find(u => u.email === email);
      if (user) {
        console.log('✅ Usuario encontrado en Auth:', {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
          created_at: user.created_at
        });
      } else {
        console.log('❌ Usuario NO encontrado en Auth');
      }
    }

    // 2. Verificar en ws_users
    console.log('\n2️⃣ Verificando en ws_users...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('ws_users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (profileError) {
      console.log('❌ Error consultando ws_users:', profileError.message);
    } else if (profile) {
      console.log('✅ Perfil encontrado en ws_users:', {
        user_id: profile.user_id,
        email: profile.email,
        name: profile.name,
        email_verified: profile.email_verified,
        created_at: profile.created_at
      });
    } else {
      console.log('❌ Perfil NO encontrado en ws_users');
    }

    // 3. Verificar en ws_email_verifications
    console.log('\n3️⃣ Verificando en ws_email_verifications...');
    const { data: verification, error: verificationError } = await supabaseAdmin
      .from('ws_email_verifications')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (verificationError) {
      console.log('❌ Error consultando ws_email_verifications:', verificationError.message);
    } else if (verification) {
      console.log('✅ Verificación encontrada:', {
        user_id: verification.user_id,
        email: verification.email,
        verified: verification.verified,
        verified_at: verification.verified_at,
        created_at: verification.created_at
      });
    } else {
      console.log('❌ Verificación NO encontrada');
    }

    console.log('\n📊 RESUMEN:');
    const authExists = users?.users.find(u => u.email === email) ? '✅' : '❌';
    const profileExists = profile ? '✅' : '❌';
    const verificationExists = verification ? '✅' : '❌';
    
    console.log(`Auth: ${authExists} | Profile: ${profileExists} | Verification: ${verificationExists}`);
    
    if (authExists === '✅' && profileExists === '❌') {
      console.log('\n⚠️ PROBLEMA DETECTADO: Usuario existe en Auth pero no tiene perfil en ws_users');
      console.log('💡 Solución: Crear el perfil manualmente o manejar este caso en el registro');
    }

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

checkUserStatus().catch(console.error);