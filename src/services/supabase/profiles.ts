import { supabaseAdmin } from './admin';


export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  store_types: string[];
  plan_id?: string;
  country_code?: string | null;
  currency_code?: string | null;
  app_id?: string | number;
  created_at: string;
  updated_at: string;
}

export const getProfile = async (email: string): Promise<Profile | null> => {
  try {
    // Fetching profile for email
    
    const { data, error } = await supabaseAdmin
      .from('ws_users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      // Si no hay perfil, evitamos ruido en consola
      console.warn('Profile not found by email or fetch error. Returning null.');
      return null;
    }

    // Profile found
    return data;
  } catch (error) {
    console.error('Error in getProfile:', {
      message: (error as any).message,
      stack: (error as any).stack
    });
    return null;
  }
};

export const getProfileByUserId = async (userId: string): Promise<Profile | null> => {
  try {
    if (!userId) {
      console.warn('getProfileByUserId: userId is empty or null');
      return null;
    }
    
    // Fetching profile for user_id
    const { data, error } = await supabaseAdmin
      .from('ws_users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // Solo logear errores reales, no "no rows returned"
      if (error.code !== 'PGRST116') {
        console.warn('Error fetching profile by user_id:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      }
      return null;
    }

    if (data) {
      // Profile found by user_id
    }
    return data;
  } catch (error) {
    console.error('Unexpected error in getProfileByUserId:', {
      message: (error as any).message,
      stack: (error as any).stack
    });
    return null;
  }
};

export const createProfile = async (userData: any): Promise<boolean> => {
  try {
    // Creating profile with data
    
    // Validar datos requeridos
    if (!userData.user_id) {
      console.error('Error: user_id is required');
      return false;
    }
    
    if (!userData.name) {
      console.error('Error: name is required');
      return false;
    }
    
    if (!userData.email) {
      console.error('Error: email is required');
      return false;
    }

    // Preparar datos para inserción
    const profileData = {
      user_id: userData.user_id,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'customer', // Default a 'customer' para usuarios registrados
      store_types: userData.store_types || [],
      plan_id: userData.plan_id || 'free', // Default a 'free' si no se especifica
      country_code: userData.country_code || null,
      currency_code: userData.currency_code || null,
      app_id: userData.app_id || '550e8400-e29b-41d4-a716-446655440000' // UUID válido por defecto
    };

    // Inserting profile data
    
    // Crear el perfil
    const { data: insertedProfile, error: profileError } = await supabaseAdmin
      .from('ws_users')
      .insert([profileData])
      .select()
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      console.error('Error details:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      });
      return false;
    }

    // Crear registro de verificación de email en ws_email_verifications
    const verificationToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { error: verificationError } = await supabaseAdmin
      .from('ws_email_verifications')
      .insert([{
        user_id: userData.user_id,
        email: userData.email,
        verified: false,
        verification_token: verificationToken
      }]);

    if (verificationError) {
      console.error('Error creating email verification record:', verificationError);
      // No fallar el registro por esto, solo logear
    }

    // Profile created successfully
    return true;
  } catch (error) {
    console.error('Error in createProfile:', error);
    return false;
  }
};

export const updateProfile = async (email: string, updates: Partial<Profile>): Promise<boolean> => {
  try {
    const { error } = await supabaseAdmin
      .from('ws_users')
      .update(updates)
      .eq('email', email);

    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return false;
  }
};

export const getStoreTypes = async (email: string): Promise<string[]> => {
  try {
    const profile = await getProfile(email);
    return profile?.store_types || [];
  } catch (error) {
    console.error('Error in getStoreTypes:', error);
    return [];
  }
}; 