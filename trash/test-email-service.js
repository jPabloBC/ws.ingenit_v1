#!/usr/bin/env node

const { sendEmail, sendVerificationEmail } = require('../src/services/emailService');

const testEmailService = async () => {
  console.log('🧪 Probando servicio de email...');
  
  try {
    // Test básico del servicio de email
    const testEmail = {
      to: 'gerencia@ingenit.cl',
      subject: 'Test de Email Service',
      html: '<h1>Prueba</h1><p>Este es un correo de prueba desde el servicio de email.</p>',
      text: 'Prueba\n\nEste es un correo de prueba desde el servicio de email.'
    };

    console.log('📧 Enviando email de prueba...');
    const response = await fetch('http://localhost:3000/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEmail)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Email enviado exitosamente:', result.messageId);
    } else {
      console.error('❌ Error al enviar email:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Error en test de email:', error);
    return { success: false, error: error.message };
  }
};

const testVerificationEmail = async () => {
  console.log('🔐 Probando email de verificación...');
  
  try {
    const testData = {
      email: 'gerencia@ingenit.cl',
      name: 'Test User',
      token: 'test-token-' + Date.now()
    };

    console.log('📧 Enviando email de verificación...');
    const response = await sendVerificationEmail(testData.email, testData.name, testData.token);
    
    if (response.success) {
      console.log('✅ Email de verificación enviado exitosamente');
    } else {
      console.error('❌ Error al enviar email de verificación:', response.error);
    }

    return response;
  } catch (error) {
    console.error('❌ Error en test de verificación:', error);
    return { success: false, error: error.message };
  }
};

const runTests = async () => {
  console.log('🚀 Iniciando pruebas de email...\n');
  
  // Verificar variables de entorno
  console.log('🔍 Verificando configuración:');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ NO CONFIGURADO');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ CONFIGURADO' : '❌ NO CONFIGURADO');
  console.log('');

  // Test básico
  await testEmailService();
  console.log('');
  
  // Test de verificación
  await testVerificationEmail();
  console.log('');
  
  console.log('🏁 Pruebas completadas');
};

if (require.main === module) {
  runTests();
}

module.exports = { testEmailService, testVerificationEmail };