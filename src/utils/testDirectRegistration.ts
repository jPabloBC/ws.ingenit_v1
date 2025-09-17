// Test directo del registro para debug
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://juupotamdjqzpxuqdtco.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dXBvdGFtZGpxenB4dXFkdGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDIyMTgsImV4cCI6MjA2NTI3ODIxOH0.8aXgTBg4vhs0DmTKPg9WGTvQ9hHBd_uCGHgt89ZfM_E";

// Cliente simple para test
const supabaseTest = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

export async function testDirectRegistration() {
  console.log('🧪 Test directo de registro...');
  
  const testData = {
    email: 'jpalebe@hotmail.com',
    password: 'TestPassword123!',
    options: {
      data: {
        name: 'Juan Pablo',
        phone: '56944344583',
        country: 'Chile',
        countryCode: 'CL',
        currencyCode: 'CLP'
      }
    }
  };
  
  console.log('📧 Intentando registro con:', testData.email);
  
  try {
    const startTime = Date.now();
    console.log('⏱️ Iniciando signUp...');
    
    const result = await supabaseTest.auth.signUp(testData);
    
    const endTime = Date.now();
    console.log(`⏱️ signUp completado en ${endTime - startTime}ms`);
    
    console.log('✅ Resultado:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error en test directo:', error);
    return { data: null, error };
  }
}