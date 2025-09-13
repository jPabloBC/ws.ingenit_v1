import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/services/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json({ error: 'Email y token requeridos' }, { status: 400 });
    }

    // Verificar que el token existe en ws_email_verifications
    const { data: verificationData, error: verificationError } = await supabase
      .from('ws_email_verifications')
      .select('*')
      .eq('verification_token', token)
      .eq('email', email)
      .single();

    if (verificationError || !verificationData) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    }

    // Actualizar email_verified en ws_users
    const { error: updateError } = await supabase
      .from('ws_users')
      .update({ email_verified: true })
      .eq('email', email);

    if (updateError) {
      console.error('Error actualizando usuario:', updateError);
      return NextResponse.json({ error: 'Error actualizando usuario' }, { status: 500 });
    }

    // Marcar verificación como completada
    const { error: verificationUpdateError } = await supabase
      .from('ws_email_verifications')
      .update({ verified: true })
      .eq('verification_token', token);

    if (verificationUpdateError) {
      console.error('Error actualizando verificación:', verificationUpdateError);
    }

    return NextResponse.json({ success: true, message: 'Email verificado exitosamente' });

  } catch (error) {
    console.error('Error en verify-email:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
