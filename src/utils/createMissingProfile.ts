import { supabaseAdmin as supabase } from '@/services/supabase/admin';

export const createMissingProfile = async (userId: string, email: string, name: string, additionalData?: any) => {
  try {
    // Creando perfil faltante para usuario
    
    // Verificar si el perfil ya existe
    const { data: existingProfile, error: checkError } = await supabase
      .from('ws_users')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (existingProfile && !checkError) {
      // El perfil ya existe
      return { success: true, profile: existingProfile };
    }
    
    // Crear el perfil
    const profileData = {
      user_id: userId,
      name: name || 'Usuario',
      email: email,
      role: 'customer',
      store_types: additionalData?.store_types || [],
      plan_id: additionalData?.plan_id || 'free',
      country_code: additionalData?.country_code || 'CL',
      currency_code: additionalData?.currency_code || 'CLP',
      app_id: '550e8400-e29b-41d4-a716-446655440000' // UUID válido por defecto
    };
    
    // Datos del perfil a crear
    
    const { data: newProfile, error: createError } = await supabase
      .from('ws_users')
      .insert([profileData])
      .select()
      .single();
    
    if (createError) {
      console.error('Error al crear perfil:', createError);
      return { success: false, error: createError };
    }
    
    // Perfil creado exitosamente
    
    // Crear suscripción gratuita
    try {
      const { error: subscriptionError } = await supabase.rpc('create_free_subscription', {
        user_uuid: userId
      });
      
      if (subscriptionError) {
        console.error('Error al crear suscripción gratuita:', subscriptionError);
      } else {
        // Suscripción gratuita creada
      }
    } catch (error) {
      console.error('Error al llamar create_free_subscription:', error);
    }
    
    return { success: true, profile: newProfile };
  } catch (error) {
    console.error('Error inesperado:', error);
    return { success: false, error };
  }
};

// Función para crear perfil desde datos de auth
export const createProfileFromAuth = async (user: any) => {
  if (!user) {
    console.error('No se proporcionó usuario');
    return { success: false, error: 'No se proporcionó usuario' };
  }
  
  const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario';
  const email = user.email;
  
  return await createMissingProfile(user.id, email, name);
};
