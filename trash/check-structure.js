// Script para ver estructura de ws_users
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://juupotamdjqzpxuqdtco.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dXBvdGFtZGpxenB4dXFkdGNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcwMjIxOCwiZXhwIjoyMDY1Mjc4MjE4fQ.qYlMzen6T8lSdaxhlngGlwrEoPMdSZp7StrGqEJ25Qo";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getTableStructure() {
  try {
    console.log('📋 Obteniendo estructura de ws_users...\n');
    
    // Obtener un registro existente para ver la estructura
    const { data: sampleData, error: sampleError } = await supabase
      .from('ws_users')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.log('❌ Error obteniendo muestra:', sampleError.message);
    } else if (sampleData && sampleData.length > 0) {
      console.log('📊 Estructura basada en datos existentes:');
      const sample = sampleData[0];
      Object.keys(sample).forEach(key => {
        console.log(`  ${key}: ${typeof sample[key]} = ${sample[key]}`);
      });
    } else {
      console.log('📋 No hay datos en la tabla para mostrar estructura');
    }

    // Intentar obtener todos los usuarios para ver qué app_id usan
    const { data: allUsers, error: allError } = await supabase
      .from('ws_users')
      .select('user_id, email, app_id')
      .limit(5);
    
    if (allError) {
      console.log('\n❌ Error obteniendo usuarios:', allError.message);
    } else {
      console.log('\n📊 Usuarios existentes (primeros 5):');
      allUsers.forEach(user => {
        console.log(`  ${user.email}: app_id = ${user.app_id}`);
      });
      
      if (allUsers.length > 0) {
        const commonAppId = allUsers[0].app_id;
        console.log(`\n💡 app_id común encontrado: ${commonAppId}`);
      }
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

getTableStructure().catch(console.error);