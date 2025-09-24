// Test del sistema de emails
const fetch = require('node-fetch');

async function testEmailSystem() {
  console.log('📧 Probando sistema de emails...\n');

  try {
    // 1. Probar API de envío de email
    console.log('1. Probando API de envío de email...');
    
    const emailData = {
      to: 'test@example.com',
      subject: 'Test Email - Ingenit',
      html: '<h1>Test Email</h1><p>Este es un email de prueba desde Ingenit.</p>',
      text: 'Test Email\n\nEste es un email de prueba desde Ingenit.'
    };

    const response = await fetch('http://localhost:3001/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ API de email funcionando correctamente');
      console.log('📧 Message ID:', result.messageId);
    } else {
      console.log('❌ Error en API de email:', result.error);
    }

  } catch (error) {
    console.log('❌ Error probando email:', error.message);
  }

  // 2. Probar función de verificación de email
  console.log('\n2. Probando generación de email de verificación...');
  
  try {
    const { createVerificationEmail, generateVerificationUrl } = require('../src/services/emailService');
    
    const token = 'test-token-123';
    const email = 'test@example.com';
    const name = 'Test User';
    
    const verificationUrl = generateVerificationUrl(token, email);
    console.log('🔗 URL de verificación:', verificationUrl);
    
    const emailContent = createVerificationEmail({
      email,
      name,
      verificationUrl
    });
    
    console.log('✅ Email de verificación generado correctamente');
    console.log('📧 Asunto:', emailContent.subject);
    console.log('📧 Destinatario:', emailContent.to);
    
  } catch (error) {
    console.log('❌ Error generando email de verificación:', error.message);
  }

  console.log('\n🏁 Test de emails completado');
}

testEmailSystem().catch(console.error);