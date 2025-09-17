import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createVerificationEmail, createWelcomeEmail, generateVerificationUrl } from '@/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const emailData = await request.json();
    console.log('📧 Recibiendo solicitud de email:', { to: emailData.to, subject: emailData.subject });

    // Usar directamente los datos del email
    const emailContent = {
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    };

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