import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createVerificationEmail, createWelcomeEmail, generateVerificationUrl } from '@/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, type, token, name, html, text } = await request.json();

    // Generar contenido del correo según el tipo
    let emailContent;
    
    if (type === 'verification') {
      const verificationUrl = generateVerificationUrl(token, to);
      emailContent = createVerificationEmail({
        email: to,
        name: name || 'Usuario',
        verificationUrl: verificationUrl
      });
    } else if (type === 'welcome') {
      const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`;
      emailContent = createWelcomeEmail({
        email: to,
        name: name || 'Usuario',
        dashboardUrl: dashboardUrl
      });
    } else {
      // Usar HTML personalizado si se proporciona
      emailContent = {
        to: to,
        subject: subject,
        html: html,
        text: text
      };
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

    // Configurar opciones del correo
    const mailOptions = {
      from: 'gerencia@ingenit.cl',
      to: emailContent.to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    // Enviar correo
    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Correo enviado exitosamente desde gerencia@ingenit.cl'
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}