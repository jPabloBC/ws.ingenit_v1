// Servicio de envío de correos personalizado
export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface VerificationEmailData {
  email: string;
  name: string;
  verificationUrl: string;
}

export interface WelcomeEmailData {
  email: string;
  name: string;
  dashboardUrl: string;
}

// Generar URL de verificación
export function generateVerificationUrl(token: string, email: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
}

// Template de correo de verificación
export function createVerificationEmail(data: VerificationEmailData): EmailData {
  return {
    to: data.email,
    subject: 'Verifica tu cuenta - Ingenit',
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Verifica tu cuenta - Ingenit</title>
        <style>
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 10px !important; }
            .header { padding: 30px 20px !important; }
            .content { padding: 30px 20px !important; }
            .button { padding: 14px 28px !important; font-size: 16px !important; }
            .title { font-size: 24px !important; }
            .subtitle { font-size: 20px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e9ecef;">
                
                <!-- Header -->
                <div class="header" style="background-color: #2563eb; padding: 40px 30px; text-align: center;">
                  <h1 class="title" style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">¡Bienvenido a Ingenit!</h1>
                  <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">Tu plataforma de gestión empresarial</p>
                </div>
                
                <!-- Content -->
                <div class="content" style="padding: 40px 30px; background-color: #ffffff;">
                  <h2 class="subtitle" style="color: #1f2937; margin: 0 0 24px 0; font-size: 22px; font-weight: 600;">Hola ${data.name},</h2>
                  
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    ¡Gracias por registrarte en Ingenit! Estamos emocionados de tenerte con nosotros.
                  </p>
                  
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                    Para activar tu cuenta y comenzar a usar nuestra plataforma, necesitas verificar tu dirección de email haciendo clic en el botón de abajo:
                  </p>
                  
                  <!-- Button -->
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${data.verificationUrl}" 
                       class="button"
                       style="background-color: #2563eb; 
                              color: #ffffff; 
                              padding: 16px 32px; 
                              text-decoration: none; 
                              border-radius: 6px; 
                              display: inline-block; 
                              font-weight: 600; 
                              font-size: 16px;
                              border: 2px solid #2563eb;
                              transition: all 0.2s ease;">
                      Verificar mi cuenta
                    </a>
                  </div>
                  
                  <!-- Alternative link -->
                  <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; margin: 32px 0;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0; font-weight: 500;">
                      Si el botón no funciona, copia y pega este enlace en tu navegador:
                    </p>
                    <p style="word-break: break-all; color: #2563eb; background: #ffffff; padding: 12px; border-radius: 4px; font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace; font-size: 12px; margin: 0; border: 1px solid #e5e7eb;">
                      ${data.verificationUrl}
                    </p>
                  </div>
                  
                  <!-- Security Notice -->
                  <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px; margin: 32px 0;">
                    <p style="margin: 0; color: #dc2626; font-size: 14px; font-weight: 500;">
                      <strong>Importante:</strong> Este enlace expira en 24 horas por seguridad.
                    </p>
                  </div>
                  
                  <!-- Features -->
                  <div style="margin: 32px 0;">
                    <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">Una vez verificado, podrás:</p>
                    <ul style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                      <li style="margin-bottom: 8px;">Acceder a tu dashboard personalizado</li>
                      <li style="margin-bottom: 8px;">Configurar tu negocio y productos</li>
                      <li style="margin-bottom: 8px;">Gestionar inventario y ventas</li>
                      <li style="margin-bottom: 8px;">Generar reportes y análisis</li>
                      <li style="margin-bottom: 8px;">Y mucho más...</li>
                    </ul>
                  </div>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">
                    Si no creaste esta cuenta, puedes ignorar este correo de forma segura.
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 0 0 4px 0;">
                    © 2024 Ingenit. Todos los derechos reservados.
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    Enviado desde gerencia@ingenit.cl
                  </p>
                </div>
                
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
      ¡Hola ${data.name}!
      
      Gracias por registrarte en Ingenit. Para activar tu cuenta, visita este enlace:
      
      ${data.verificationUrl}
      
      Este enlace expira en 24 horas por seguridad.
      
      Una vez verificado, podrás:
      - Acceder a tu dashboard personalizado
      - Configurar tu negocio y productos
      - Gestionar inventario y ventas
      - Generar reportes y análisis
      - Y mucho más...
      
      Si no creaste esta cuenta, puedes ignorar este correo de forma segura.
      
      © 2024 Ingenit. Todos los derechos reservados.
      Enviado desde gerencia@ingenit.cl
    `
  };
}

// Template de correo de bienvenida
export function createWelcomeEmail(data: WelcomeEmailData): EmailData {
  return {
    to: data.email,
    subject: '¡Bienvenido a Ingenit! Tu cuenta está lista',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>¡Bienvenido a Ingenit!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 ¡Cuenta Verificada!</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #2563eb; margin-top: 0;">¡Hola ${data.name}!</h2>
          
          <p>¡Excelente! Tu cuenta ha sido verificada exitosamente. Ya puedes comenzar a usar Ingenit.</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${data.dashboardUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block; 
                      font-weight: bold; 
                      font-size: 16px;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              🚀 Ir a mi Dashboard
            </a>
          </div>
          
          <h3 style="color: #2563eb;">¿Qué puedes hacer ahora?</h3>
          <ul style="color: #666;">
            <li>📊 Configurar tu perfil de negocio</li>
            <li>📦 Gestionar tu inventario</li>
            <li>💰 Registrar ventas</li>
            <li>📈 Ver estadísticas</li>
            <li>⚙️ Configurar integraciones</li>
          </ul>
          
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #0c5460;">
              <strong>💡 Tip:</strong> Revisa la guía de inicio rápido en tu dashboard para comenzar.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; border-top: 1px solid #e9ecef;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            ¿Necesitas ayuda? Contáctanos en gerencia@ingenit.cl
          </p>
          <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;">
            © 2024 Ingenit. Todos los derechos reservados.
          </p>
          <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">
            Enviado desde gerencia@ingenit.cl
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
      ¡Hola ${data.name}!
      
      ¡Excelente! Tu cuenta ha sido verificada exitosamente. Ya puedes comenzar a usar Ingenit.
      
      Visita tu dashboard: ${data.dashboardUrl}
      
      ¿Qué puedes hacer ahora?
      - Configurar tu perfil de negocio
      - Gestionar tu inventario
      - Registrar ventas
      - Ver estadísticas
      - Configurar integraciones
      
      ¿Necesitas ayuda? Contáctanos en gerencia@ingenit.cl
      
      Saludos,
      El equipo de Ingenit
      
      Enviado desde gerencia@ingenit.cl
    `
  };
}

// Función para enviar correo usando API local
export async function sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    const data = await response.json();

    if (!data.success) {
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Función específica para enviar correo de verificación
export async function sendVerificationEmail(email: string, name: string, token: string): Promise<{ success: boolean; error?: string }> {
  const verificationUrl = generateVerificationUrl(token, email);
  const emailData = createVerificationEmail({ email, name, verificationUrl });
  return await sendEmail(emailData);
}

// Función específica para enviar correo de bienvenida
export async function sendWelcomeEmail(email: string, name: string): Promise<{ success: boolean; error?: string }> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`;
  const emailData = createWelcomeEmail({ email, name, dashboardUrl });
  return await sendEmail(emailData);
}
