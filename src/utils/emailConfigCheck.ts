import { supabase } from '@/services/supabase/client';

export const checkEmailConfiguration = async () => {
  try {
    console.log('🔍 Verificando configuración de email...');
    
    // Verificar configuración de autenticación
    const { data: authConfig, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Error al verificar configuración de auth:', authError);
      return { success: false, error: authError };
    }
    
    console.log('✅ Configuración de auth verificada');
    
    // Verificar si el usuario está autenticado
    if (authConfig.session) {
      console.log('👤 Usuario autenticado:', authConfig.session.user.email);
      console.log('📧 Email confirmado:', authConfig.session.user.email_confirmed_at ? 'Sí' : 'No');
    } else {
      console.log('👤 No hay usuario autenticado');
    }
    
    return { success: true, data: authConfig };
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return { success: false, error };
  }
};

export const testEmailVerification = async (email: string) => {
  try {
    console.log('📧 Probando envío de email de verificación...');
    
    // Intentar enviar email de verificación
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    });
    
    if (error) {
      console.error('❌ Error al enviar email:', error);
      return { success: false, error };
    }
    
    console.log('✅ Email de verificación enviado:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return { success: false, error };
  }
};
