import { supabase } from './client';

export interface ActiveSession {
  id: string;
  user_id: string;
  session_token: string;
  device_info: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  last_activity: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface SessionDeviceInfo {
  browser?: string;
  os?: string;
  device?: string;
  screen?: string;
  timezone?: string;
}

export const sessionsService = {
  // Obtener sesiones activas del usuario
  getUserActiveSessions: async (userId: string): Promise<ActiveSession[]> => {
    try {
      const { data, error } = await supabase
        .from('ws_active_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('last_activity', { ascending: false });

      if (error) {
        console.error('Error fetching user sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserActiveSessions:', error);
      return [];
    }
  },

  // Verificar si el usuario puede crear una nueva sesión
  canCreateSession: async (userId: string): Promise<{ canCreate: boolean; activeCount: number; maxAllowed: number }> => {
    try {
      const { data, error } = await supabase.rpc('check_session_limit', {
        p_user_id: userId
      });

      if (error) {
        // Si la función RPC no existe aún, permitir creación (modo tolerante)
        if ((error as any)?.code === 'PGRST202' || /Could not find the function/i.test(error.message)) {
          console.warn('[sessions] RPC check_session_limit no encontrada, usando defaults permisivos');
          const activeSessions = await sessionsService.getUserActiveSessions(userId);
          return { canCreate: true, activeCount: activeSessions.length, maxAllowed: 1 };
        }
        console.error('Error checking session limit:', error);
        return { canCreate: true, activeCount: 0, maxAllowed: 1 }; // fallback permisivo para no bloquear login
      }

      // Obtener información adicional
      const activeSessions = await sessionsService.getUserActiveSessions(userId);
      const { data: userData } = await supabase
        .from('ws_users')
        .select('max_sessions')
        .eq('user_id', userId)
        .single();

      return {
        canCreate: data || false,
        activeCount: activeSessions.length,
        maxAllowed: userData?.max_sessions || 1
      };
    } catch (error) {
      console.error('Error in canCreateSession:', error);
      return { canCreate: false, activeCount: 0, maxAllowed: 1 };
    }
  },

  // Crear nueva sesión
  createSession: async (
    userId: string, 
    sessionToken: string, 
    deviceInfo?: SessionDeviceInfo,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> => {
    try {
      // Verificar si puede crear sesión
      const { canCreate, activeCount, maxAllowed } = await sessionsService.canCreateSession(userId);
      
      if (!canCreate && activeCount >= maxAllowed) {
        return {
          success: false,
          error: `Límite de sesiones alcanzado (${activeCount}/${maxAllowed}). Cierra sesiones en otros dispositivos o actualiza tu plan.`
        };
      }

      const { data, error } = await supabase.rpc('create_user_session', {
        p_user_id: userId,
        p_session_token: sessionToken,
        p_device_info: deviceInfo || {},
        p_ip_address: ipAddress || null,
        p_user_agent: userAgent || null
      });

      if (error) {
        if ((error as any)?.code === 'PGRST202' || /Could not find the function/i.test(error.message)) {
          console.warn('[sessions] RPC create_user_session no encontrada, continuando sin registrar sesión');
          return { success: true, sessionId: undefined };
        }
        console.error('Error creating session:', error);
        return { success: false, error: error.message };
      }

      return { success: true, sessionId: data };
    } catch (error) {
      console.error('Error in createSession:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  },

  // Actualizar actividad de sesión
  updateSessionActivity: async (sessionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ws_active_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating session activity:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSessionActivity:', error);
      return false;
    }
  },

  // Cerrar sesión específica
  closeSession: async (sessionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ws_active_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) {
        console.error('Error closing session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in closeSession:', error);
      return false;
    }
  },

  // Cerrar todas las sesiones del usuario
  closeAllUserSessions: async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ws_active_sessions')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) {
        console.error('Error closing all user sessions:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in closeAllUserSessions:', error);
      return false;
    }
  },

  // Limpiar sesiones expiradas
  cleanupExpiredSessions: async (): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_sessions');

      if (error) {
        console.error('Error cleaning up expired sessions:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in cleanupExpiredSessions:', error);
      return 0;
    }
  },

  // Obtener información del dispositivo
  getDeviceInfo: (): SessionDeviceInfo => {
    if (typeof window === 'undefined') {
      return {};
    }

    const userAgent = navigator.userAgent;
    const screenSize = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return {
      browser: userAgent,
      screen: screenSize,
      timezone,
      // Información básica del dispositivo
      device: /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 'desktop'
    };
  },

  // Generar token de sesión único
  generateSessionToken: (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
  }
};
