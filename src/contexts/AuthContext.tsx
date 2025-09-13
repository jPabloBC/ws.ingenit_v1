'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/services/supabase/admin';
import { supabase } from '@/services/supabase/client';
// TODO: Implement createProfileService
const createProfileService = async (userData: any) => {
  return { error: null };
};
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  createProfile: (userData: any) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }: { data: { session: Session | null }, error: any }) => {
      if (error) {
        console.error('Error getting session:', error);
        // No mostrar error al usuario si es un problema de conectividad
        if (error.message?.includes('Failed to fetch')) {
          console.warn('Problema de conectividad detectado');
        }
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Cargar el rol del usuario si hay sesión y email verificado
      if (session?.user && session.user.email_confirmed_at) {
        await loadUserRole(session.user.id);
      }
      
      setLoading(false);
    }).catch((error: any) => {
      console.error('Error in getSession:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Cargar el rol del usuario cuando cambie la sesión
      if (session?.user) {
        // Solo cargar rol si el email está verificado
        if (session.user.email_confirmed_at) {
          await loadUserRole(session.user.id);
        } else {
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserRole = async (userId: string) => {
    try {
      // Solo cargar rol si hay un usuario válido
      if (!userId) {
        setUserRole(null);
        return;
      }

      // No cargar perfil en la página de registro - el usuario aún no tiene perfil
      if (typeof window !== 'undefined' && window.location.pathname === '/register') {
        setUserRole('customer'); // Rol por defecto para registro
        return;
      }

      // Loading user role
      
      // Primero verificar si el campo role existe
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('ws_users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        // Si el perfil no existe, solo establecer rol por defecto
        if (profileError.code === 'PGRST116' || profileError.message?.includes('No rows found')) {
          // Perfil no encontrado - esto es normal para usuarios recién registrados
          // El perfil se creará cuando el usuario complete el registro
          setUserRole('customer'); // Default role
          return;
        }
        // Solo mostrar error si no es un error de "no encontrado" para usuarios no autenticados
        if (profileError.code !== 'PGRST116') {
          console.error('Error loading profile:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          });
        }
        setUserRole('user'); // Default role
        return;
      }

        // Profile data loaded
      
      // Si el campo role no existe, usar 'user' por defecto
      if (!profileData || !('role' in profileData)) {
        // Role field not found, using default: user
        setUserRole('user');
        return;
      }

      const role = profileData.role || 'user';
      
      // Validar que el rol sea válido
      if (!['user', 'admin', 'dev', 'customer'].includes(role)) {
        // Invalid role found, using default: user
        setUserRole('user');
        return;
      }
      
      // User role set
      setUserRole(role);
      
    } catch (error) {
      // Solo mostrar error si no es un error esperado para usuarios no autenticados
      if (error && typeof error === 'object' && 'code' in error && (error as any).code !== 'PGRST116') {
        console.error('Error in loadUserRole:', {
          code: (error as any).code,
          message: (error as any).message,
          details: (error as any).details,
          hint: (error as any).hint
        });
      }
      setUserRole('user'); // Default role
    }
  };

  const signIn = async (email: string, password: string) => {
    // Primero cerrar cualquier sesión existente
    await supabase.auth.signOut();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('🔍 Login attempt result:', { 
      user: data?.user ? {
        id: data.user.id,
        email: data.user.email,
        email_confirmed_at: data.user.email_confirmed_at,
        created_at: data.user.created_at
      } : null,
      error: error?.message
    });
    
    // Si el login fue exitoso, verificar en ws_email_verifications
    if (data.user) {
      try {
        const { data: verification, error: verificationError } = await supabaseAdmin
          .from('ws_email_verifications')
          .select('verified')
          .eq('user_id', data.user.id)
          .single();

        // Si no está verificado, redirigir al registro para verificar
        if (verificationError || !verification || !verification.verified) {
          console.log('📧 Usuario no verificado, redirigiendo a verificación:', data.user.email);
          // No cerrar sesión, mantener al usuario logueado para el flujo de verificación
          // Redirigir inmediatamente al paso de verificación
          if (typeof window !== 'undefined') {
            window.location.href = '/register?step=verification';
          }
          return { 
            error: { 
              message: 'EMAIL_NOT_VERIFIED',
              redirectTo: '/register?step=verification'
            } 
          };
        }
      } catch (error) {
        console.log('📧 Error verificando email, redirigiendo a verificación:', error);
        // Redirigir inmediatamente al paso de verificación
        if (typeof window !== 'undefined') {
          window.location.href = '/register?step=verification';
        }
        return { 
          error: { 
            message: 'EMAIL_NOT_VERIFIED',
            redirectTo: '/register?step=verification'
          } 
        };
      }
    }
    
    if (data.user && data.user.email_confirmed_at) {
      console.log('✅ Usuario verificado, login permitido:', data.user.email);
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const createProfile = async (userData: any) => {
    return await createProfileService(userData);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    userRole,
    signIn,
    signUp,
    signOut,
    createProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 