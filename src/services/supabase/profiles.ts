import { supabase } from './client';
import { createFreeSubscription } from './subscriptions';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  store_types: string[];
  created_at: string;
  updated_at: string;
}

export const getProfile = async (email: string): Promise<Profile | null> => {
  try {
    console.log('Fetching profile for email:', email);
    
    const { data, error } = await supabase
      .from('ws_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }

    console.log('Profile found:', data);
    return data;
  } catch (error) {
    console.error('Error in getProfile:', error);
    return null;
  }
};

export const createProfile = async (userData: any): Promise<{ error: any }> => {
  try {
    console.log('Creating profile with data:', userData);
    
    // Crear el perfil
    const { data: profileData, error: profileError } = await supabase
      .from('ws_profiles')
      .insert([{
        user_id: userData.user_id,
        name: userData.name,
        email: userData.email,
        store_types: userData.store_types || []
      }])
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
      return { error: profileError };
    }

    console.log('Profile created successfully:', profileData);

    // Crear suscripción gratuita automáticamente
    if (userData.user_id) {
      const { error: subscriptionError } = await createFreeSubscription(userData.user_id);
      if (subscriptionError) {
        console.error('Error creating free subscription:', subscriptionError);
        // No retornamos error aquí porque el perfil ya se creó exitosamente
      } else {
        console.log('Free subscription created successfully');
      }
    }

    return { error: null };
  } catch (error) {
    console.error('Error in createProfile:', error);
    return { error };
  }
};

export const updateProfile = async (email: string, updates: Partial<Profile>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('ws_profiles')
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