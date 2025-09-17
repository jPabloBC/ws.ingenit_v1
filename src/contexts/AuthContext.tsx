import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase/client';
import { sessionsService } from '@/services/supabase/sessions';
// TODO: Implement createProfileService
const createProfileService = async (userData: any) => {
  return { error: null };
};
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  activeSessions: any[];
  signIn: (email: string, password: string) => Promise<{ error: any; nextRoute?: string | null }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  createProfile: (userData: any) => Promise<{ error: any }>;
  closeSession: (sessionId: string) => Promise<boolean>;
  getActiveSessions: () => Promise<void>;
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
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  // Ref para evitar subscribir múltiples veces (HMR / re-mounts)
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (subscribedRef.current) return; // ya inicializado
    subscribedRef.current = true;
    let active = true;

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!active) return;
        if (error) {
          // console.log('[Auth] getSession error:', error.message);
          setLoading(false);
          return;
        }
        if (!session) {
          setSession(null);
            setUser(null);
            setUserRole(null);
            setLoading(false);
        } else {
          // Expiration check
          const now = Date.now() / 1000;
          if (session.expires_at && session.expires_at < now) {
            // console.log('[Auth] Session expired at mount');
            await supabase.auth.signOut();
            if (!active) return;
            setSession(null);
            setUser(null);
            setUserRole(null);
          } else {
            setSession(session);
            setUser(session.user);
            if (session.user?.email_confirmed_at) {
              await loadUserRole(session.user.id);
            }
          }
          setLoading(false);
        }
      } catch (e) {
  // console.error('[Auth] init error', e);
        if (active) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
  // console.log('🔄 Auth state change:', event, !!session?.user);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        try {
          const { data: userData } = await supabase
            .from('ws_users')
            .select('email_verified')
            .eq('email', session.user.email)
            .maybeSingle();
          if (userData?.email_verified || session.user.email_confirmed_at) {
            await loadUserRole(session.user.id);
          } else {
            setUserRole(null);
          }
        } catch (err) {
          // console.error('[Auth] email verification check failed', err);
          if (session.user.email_confirmed_at) {
            await loadUserRole(session.user.id);
          } else {
            setUserRole(null);
          }
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
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

  // console.log('Loading user role for:', userId);
      
      // Primero verificar si el campo role existe
      const { data: profileData, error: profileError } = await supabase
        .from('ws_users')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        // Si el perfil no existe, solo establecer rol por defecto
        if (profileError.code === 'PGRST116' || profileError.message?.includes('No rows found')) {
          // console.log('Profile not found, using default role');
          setUserRole('customer'); // Default role
          return;
        }
        // Solo mostrar error si no es un error de "no encontrado"
  // console.error('Error loading profile:', profileError);
        setUserRole('user'); // Default role
        return;
      }

      // Si el campo role no existe, usar 'user' por defecto
      if (!profileData || !('role' in profileData)) {
  // console.log('Role field not found, using default: user');
        setUserRole('user');
        return;
      }

      const role = profileData.role || 'user';
      
      // Validar que el rol sea válido
      if (!['user', 'admin', 'dev', 'customer'].includes(role)) {
        console.log('Invalid role found, using default: user');
        setUserRole('user');
        return;
      }
      
      console.log('User role set:', role);
      setUserRole(role);
      
    } catch (error) {
      console.error('Error in loadUserRole:', error);
      setUserRole('user'); // Default role
    }
  };

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      console.log('🔐 Iniciando signIn para:', email);
      
      // NOTA: Removiendo signOut() que se colgaba
      // await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('� SignInWithPassword completado, resultado:', !!data?.user, !!error);
      
      // Si hay error de autenticación, retornarlo directamente
      if (error) {
        console.log('🔐 Error de autenticación:', error.message);
        return { error };
      }

      // Si no hay usuario, retornar error
      if (!data.user) {
        console.log('🔐 No hay usuario en respuesta');
        return { error: { message: 'No user data received' } };
      }

      console.log('🔐 Usuario autenticado, verificando email...');
      
      // Si el login fue exitoso, verificar estado del usuario
      try {
        // Normalizar email del usuario (puede ser opcional en el tipo)
        const rawEmail = data.user.email || email; // fallback al email usado en login
        if (!rawEmail) {
          console.log('❌ No se pudo determinar el email del usuario tras login');
          return { error: { message: 'EMAIL_NOT_AVAILABLE' } };
        }
        const normalizedEmail = rawEmail.toLowerCase();
        // Verificar si el email está verificado usando la tabla de verificaciones
        console.log('🔐 Consultando ws_email_verifications...');
        const { data: verification, error: verificationError } = await supabase
          .from('ws_email_verifications')
          .select('verified')
          .eq('email', normalizedEmail)
          .maybeSingle();
        console.log('🔐 Resultado ws_email_verifications:', { verification: verification?.verified, error: verificationError?.message });

        if (verificationError || !verification?.verified) {
          console.log('📧 Usuario no verificado:', data.user.email, verificationError?.message);
          return { error: { message: 'EMAIL_NOT_VERIFIED' }, nextRoute: null };
        }

        // Email verificado, verificar si tiene negocio seleccionado
        console.log('✅ Email verificado, consultando ws_users...');

        const { data: userData, error: userError } = await supabase
          .from('ws_users')
          .select('store_types, email_verified')
          .eq('email', normalizedEmail)
          .maybeSingle();
        console.log('🔐 Resultado ws_users:', { userData: !!userData, storeTypes: userData?.store_types, error: userError?.message });

        if (userError) {
          console.log('❌ Error obteniendo datos del usuario:', userError);
          return { error: { message: 'No se encontró el email', redirectTo: '/register?step=verification' }, nextRoute: '/register?step=verification' };
        }

        if (!userData) {
          console.log('❌ Usuario no encontrado en ws_users:', data.user.email);
          return { error: { message: 'No se encontró el email', redirectTo: '/register?step=verification' }, nextRoute: '/register?step=verification' };
        }

        // Usuario verificado, verificar si tiene negocio configurado
        if (userData?.store_types && userData.store_types.length > 0) {
          // Ya tiene negocio configurado, ir al dashboard
          console.log('✅ Usuario tiene negocio configurado, redirigiendo al dashboard');
          
          try {
            const sessionToken = sessionsService.generateSessionToken();
            const deviceInfo = sessionsService.getDeviceInfo();

            const sessionResult = await sessionsService.createSession(
              data.user.id,
              sessionToken,
              deviceInfo
            );

            if (!sessionResult.success) {
              console.warn('⚠️ Error creando sesión (no bloqueante):', sessionResult.error);
            }

            console.log('✅ Sesión creada exitosamente:', sessionResult.sessionId);
          } catch (sessionError) {
            console.error('❌ Error en sistema de sesiones (no bloqueante):', sessionError);
          }
          
          console.log('✅ Usuario verificado, login permitido:', normalizedEmail);
          return { error: null, nextRoute: '/dashboard' };
        } else {
          // No tiene negocio configurado, ir al selector
          console.log('✅ Usuario sin negocio configurado, redirigiendo al selector');
          return { error: null, nextRoute: `/select-business?email=${encodeURIComponent(normalizedEmail)}` };
        }

      } catch (error) {
        console.log('📧 Error verificando estado del usuario:', error);
        return { error: { message: 'EMAIL_NOT_VERIFIED' }, nextRoute: null };
      }

    } catch (error) {
      console.error('Error in signIn:', error);
      return { error: { message: 'Error interno del servidor', details: error instanceof Error ? error.message : String(error) }, nextRoute: null };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  }, []);

  const createProfile = useCallback(async (userData: any) => {
    return await createProfileService(userData);
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Cerrar todas las sesiones del usuario en ws_active_sessions
      if (user) {
        try {
          await sessionsService.closeAllUserSessions(user.id);
          console.log('✅ Todas las sesiones cerradas en ws_active_sessions');
        } catch (sessionError) {
          console.error('⚠️ Error cerrando sesiones:', sessionError);
        }
      }
      
      // Cerrar sesión en Supabase
      await supabase.auth.signOut();
      
      // Limpiar estado local
      setSession(null);
      setUser(null);
      setUserRole(null);
      setActiveSessions([]);
      
      // Limpiar storage manualmente
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.clear();
      }
      
      console.log('Session cleared completely');
    } catch (error) {
      console.error('Error during signOut:', error);
      // Aún así limpiar el estado local
      setSession(null);
      setUser(null);
      setUserRole(null);
    }
  }, []);

  // Función para cerrar una sesión específica
  const closeSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      const result = await sessionsService.closeSession(sessionId);
      if (result) {
        await getActiveSessions(); // Actualizar la lista
      }
      return result;
    } catch (error) {
      console.error('Error closing session:', error);
      return false;
    }
  }, []);

  // Función para obtener sesiones activas
  const getActiveSessions = useCallback(async (): Promise<void> => {
    if (!user?.id) return;
    
    try {
      const sessions = await sessionsService.getUserActiveSessions(user.id);
      setActiveSessions(sessions);
    } catch (error) {
      console.error('Error getting active sessions:', error);
    }
  }, [user?.id]);

  const stableUser = useMemo(() => user, [user?.id]);
  
  // Stabilize other values that change frequently
  const stableLoading = useMemo(() => loading, [loading]);
  const stableUserRole = useMemo(() => userRole, [userRole]);
  const stableSession = useMemo(() => session, [session?.access_token]);

  const value = useMemo(() => ({
    user: stableUser,
    session: stableSession,
    loading: stableLoading,
    userRole: stableUserRole,
    activeSessions,
    signIn,
    signUp,
    signOut,
    createProfile,
    closeSession,
    getActiveSessions,
  }), [stableUser, stableSession, stableLoading, stableUserRole, activeSessions, signIn, signUp, signOut, createProfile, closeSession, getActiveSessions]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 