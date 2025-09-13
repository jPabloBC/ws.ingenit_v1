import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/admin';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json({ 
        success: false, 
        error: 'userId y email son requeridos' 
      }, { status: 400 });
    }

    // Generar token único de verificación
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calcular expiración (24 horas)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Insertar token en la base de datos
    const { data, error } = await supabaseAdmin
      .from('ws_verification_tokens')
      .insert({
        user_id: userId,
        email: email,
        token: token,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (error) {
      console.error('Error creating verification token:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Error al crear token de verificación' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      token: token,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Error in create-verification-token:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
