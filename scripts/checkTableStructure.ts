import { supabaseAdmin } from '../src/services/supabase/admin';

async function checkTableStructure() {
  try {
    console.log('🔍 Checking table structure...');

    // Check if app_ws.ws_public_products exists
    console.log('\n1️⃣ Checking app_ws.ws_public_products...');
    try {
      const { data: wsData, error: wsError } = await supabaseAdmin
        .from('ws_public_products')
        .select('*')
        .limit(1);

      if (wsError) {
        console.log('❌ app_ws.ws_public_products does not exist or is not accessible');
        console.log('Error:', wsError.message);
      } else {
        console.log(`✅ app_ws.ws_public_products exists with ${wsData?.length || 0} sample records`);
      }
    } catch (error) {
      console.log('❌ app_ws.ws_public_products: Error accessing table');
    }

    // Check if public.public_products exists and if it's a table or view
    console.log('\n2️⃣ Checking public.public_products...');
    try {
      const { data: publicData, error: publicError } = await supabaseAdmin
        .from('public_products')
        .select('*')
        .limit(3);

      if (publicError) {
        console.log('❌ public.public_products error:', publicError.message);
      } else {
        console.log(`✅ public.public_products accessible with ${publicData?.length || 0} records`);
        if (publicData && publicData.length > 0) {
          console.log('   Sample record:', publicData[0].name);
        }
      }
    } catch (error) {
      console.log('❌ public.public_products: Error accessing');
    }

    // Check what schema we're actually using
    console.log('\n3️⃣ Testing insertion target...');
    
    // Test where addPublicProduct is trying to insert
    const testProduct = {
      name: 'Test Product - Check Schema',
      description: 'Test to see which table receives the data',
      brand: 'Test Brand',
      category: 'Test',
      price: 1.00,
      country: 'Chile',
      source: 'test'
    };

    console.log('Attempting to insert test product...');
    try {
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('public_products')
        .insert([testProduct])
        .select()
        .single();

      if (insertError) {
        console.log('❌ Insert failed:', insertError.message);
      } else {
        console.log('✅ Insert successful:', insertData.name);
        console.log('   Inserted ID:', insertData.id);
        
        // Clean up - delete the test record
        await supabaseAdmin
          .from('public_products')
          .delete()
          .eq('id', insertData.id);
        console.log('   🧹 Test record cleaned up');
      }
    } catch (error) {
      console.log('❌ Insert test failed:', error);
    }

    console.log('\n📊 Summary:');
    console.log('- The current code inserts into: public.public_products');
    console.log('- This should either be:');
    console.log('  a) The actual table (current setup)');
    console.log('  b) A VIEW pointing to app_ws.ws_public_products (after migration)');

  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  }
}

// Run the check
checkTableStructure();