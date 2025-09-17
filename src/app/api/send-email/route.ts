import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createVerificationEmail, createWelcomeEmail, generateVerificationUrl } from '@/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const emailData = await request.json();
    console.log('📧 Recibiendo solicitud de email:', { to: emailData.to, subject: emailData.subject });
    console.log('🔐 Configuración EMAIL_USER:', process.env.EMAIL_USER);
    console.log('🔐 EMAIL_PASS configurado:', !!process.env.EMAIL_PASS);

    // Usar directamente los datos del email
    const emailContent = {
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    };

    // Verificar variables de entorno
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Variables de entorno de email no configuradas');
      return NextResponse.json({ 
        success: false, 
        error: 'Variables de entorno EMAIL_USER o EMAIL_PASS no configuradas' 
      }, { status: 500 });
    }

    // Configurar Nodemailer con Titan SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.titan.email',
      port: 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verificar la conexión
    console.log('🔗 Verificando conexión SMTP...');
    try {
      await transporter.verify();
      console.log('✅ Conexión SMTP verificada');
    } catch (verifyError) {
      console.error('❌ Error verificando conexión SMTP:', verifyError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error de conexión SMTP: ' + (verifyError as Error).message 
      }, { status: 500 });
    }

    // Configurar opciones del correo
    const mailOptions = {
      from: 'gerencia@ingenit.cl',
      to: emailContent.to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    // Enviar correo
    console.log('📤 Enviando email a:', emailContent.to);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado exitosamente:', info.messageId);

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Correo enviado exitosamente desde gerencia@ingenit.cl'
    });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}