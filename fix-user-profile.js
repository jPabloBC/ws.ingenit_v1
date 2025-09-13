// Script para crear perfil de usuario manualmente
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://juupotamdjqzpxuqdtco.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dXBvdGFtZGpxenB4dXFkdGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDIyMTgsImV4cCI6MjA2NTI3ODIxOH0.8aXgTBg4vhs0DmTKPg9WGTvQ9hHBd_uCGHgt89ZfM_E';

// Cliente con schema app_ws
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'app_ws' }
});

async function createMissingProfiles() {
  try {
    console.log('🔍 Buscando usuarios sin perfil...');
    
    // Obtener usuarios de auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error obteniendo usuarios:', authError);
      return;
    }
    
    console.log(`📊 Encontrados ${authUsers.users.length} usuarios en auth.users`);
    
    for (const authUser of authUsers.users) {
      console.log(`\n👤 Procesando usuario: ${authUser.email}`);
      
      // Verificar si ya tiene perfil
      const { data: existingProfile, error: checkError } = await supabase
        .from('ws_users')
        .select('*')
        .eq('user_id', authUser.id)
        .single();
      
      if (existingProfile && !checkError) {
        console.log('✅ Ya tiene perfil');
        continue;
      }
      
      // Crear perfil
      const profileData = {
        user_id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuario',
        email: authUser.email,
        role: 'customer',
        store_types: [],
        plan_id: 'free',
        country_code: 'CL',
        currency_code: 'CLP',
        app_id: '550e8400-e29b-41d4-a716-446655440000'
      };
      
      const { data: newProfile, error: createError } = await supabase
        .from('ws_users')
        .insert([profileData])
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creando perfil:', createError);
      } else {
        console.log('✅ Perfil creado exitosamente');
      }
    }
    
    console.log('\n🎯 Proceso completado');
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

createMissingProfiles();
