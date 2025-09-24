const { createClient } = require('@supabase/supabase-js');

async function testSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔍 Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey ? 'Present' : 'Missing');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('ws_products').select('count').limit(1);
    console.log('✅ Supabase connection successful');
    console.log('Products count:', data);
  } catch (err) {
    console.error('❌ Supabase connection failed:', err.message);
  }
}

testSupabase();


