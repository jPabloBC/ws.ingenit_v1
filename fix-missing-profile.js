// Script temporal para crear perfil faltante
// Ejecutar en la consola del navegador en http://localhost:3000

(async () => {
  try {
    console.log('🔧 Creando perfil faltante...');
    
    // Obtener datos del usuario actual
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Error al obtener usuario:', userError);
      return;
    }
    
    console.log('👤 Usuario encontrado:', user.email);
    
    // Verificar si el perfil ya existe
    const { data: existingProfile, error: checkError } = await window.supabase
      .from('ws_users')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (existingProfile && !checkError) {
      console.log('✅ El perfil ya existe:', existingProfile);
      return;
    }
    
    // Crear el perfil
    const profileData = {
      user_id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
      email: user.email,
      role: 'customer',
      store_types: [],
      plan_id: 'free',
      country_code: 'CL',
      currency_code: 'CLP'
    };
    
    console.log('📝 Creando perfil con datos:', profileData);
    
    const { data: newProfile, error: createError } = await window.supabase
      .from('ws_users')
      .insert([profileData])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error al crear perfil:', createError);
      return;
    }
    
    console.log('✅ Perfil creado exitosamente:', newProfile);
    
    // Crear suscripción gratuita
    try {
      const { error: subscriptionError } = await window.supabase.rpc('create_free_subscription', {
        user_uuid: user.id
      });
      
      if (subscriptionError) {
        console.error('⚠️ Error al crear suscripción gratuita:', subscriptionError);
      } else {
        console.log('✅ Suscripción gratuita creada');
      }
    } catch (error) {
      console.error('⚠️ Error al llamar create_free_subscription:', error);
    }
    
    console.log('🎉 ¡Perfil creado exitosamente! Recarga la página para ver los cambios.');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
})();
