'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testEmail = async () => {
    if (!email || !name) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      // Generar token y URL de verificación
      const token = crypto.randomUUID();
      const verificationUrl = `${window.location.origin}/auth/callback?token=${token}&email=${encodeURIComponent(email)}`;
      
      // Crear el HTML del correo
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verifica tu cuenta</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">¡Bienvenido a Ingenit!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #2563eb; margin-top: 0;">Hola ${name},</h2>
            
            <p>¡Gracias por registrarte en Ingenit! Estamos emocionados de tenerte con nosotros.</p>
            
            <p>Para activar tu cuenta y comenzar a usar nuestra plataforma, necesitas verificar tu dirección de email haciendo clic en el botón de abajo:</p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: bold; 
                        font-size: 16px;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                ✅ Verificar mi cuenta
              </a>
            </div>
            
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #666; background: #f1f3f4; padding: 10px; border-radius: 5px; font-family: monospace;">
              ${verificationUrl}
            </p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>⏰ Importante:</strong> Este enlace expira en 24 horas por seguridad.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; border-top: 1px solid #e9ecef;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Si no creaste esta cuenta, puedes ignorar este correo de forma segura.
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
      `;

      const text = `
        ¡Hola ${name}!
        
        Gracias por registrarte en Ingenit. Para activar tu cuenta, visita este enlace:
        
        ${verificationUrl}
        
        Este enlace expira en 24 horas.
        
        Si no creaste esta cuenta, puedes ignorar este correo.
        
        Saludos,
        El equipo de Ingenit
        
        Enviado desde gerencia@ingenit.cl
      `;

      // Enviar correo usando la API local
      const response = await fetch('/api/test-email-local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: 'Verifica tu cuenta - Ingenit',
          html: html,
          text: text
        })
      });

      const data = await response.json();
      
      setResult(data);
      
      if (data.success) {
        toast.success('Correo de prueba enviado exitosamente');
      } else {
        toast.error('Error enviando correo: ' + data.error);
      }
    } catch (err) {
      const errorMsg = (err as Error).message;
      setResult({ success: false, error: errorMsg });
      toast.error('Error: ' + errorMsg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Prueba de Envío de Correos
        </h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Configuración de Prueba
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de destino:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu-email@ejemplo.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu Nombre"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={testEmail}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Enviar Correo de Prueba'}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Resultado:
            </h3>
            <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? 'Correo enviado exitosamente' : 'Error enviando correo'}
              </p>
              {result.error && (
                <p className="text-sm text-red-600 mt-2">
                  Error: {result.error}
                </p>
              )}
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                Ver detalles técnicos
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Instrucciones de Prueba
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>Ingresa tu email real para recibir el correo de prueba</li>
            <li>Ingresa tu nombre</li>
            <li>Haz clic en "Enviar Correo de Prueba"</li>
            <li>Revisa tu bandeja de entrada (y spam)</li>
            <li>El correo debe llegar desde <strong>gerencia@ingenit.cl</strong></li>
            <li>Haz clic en el enlace del correo para probar la verificación</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
