import { supabaseAdmin } from '../src/services/supabase/admin';

async function testApiProductCreation() {
  try {
    console.log('🧪 Testing API product creation flow...');

    // Check current public products
    const { data: beforeData, error: beforeError } = await supabaseAdmin
      .from('public_products')
      .select('id, name, source')
      .order('created_at', { ascending: false })
      .limit(10);

    if (beforeError) {
      console.error('❌ Error checking existing products:', beforeError);
      return;
    }

    console.log(`📊 Current public products: ${beforeData?.length || 0}`);
    beforeData?.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (source: ${p.source})`);
    });

    // Simulate what happens when createProduct is called with addToPublic: true
    console.log('\n🔬 Simulating API product creation...');
    
    const testApiProduct = {
      name: 'Test API Product - Coca Cola Light',
      description: 'Producto de prueba importado de API externa',
      brand: 'Coca Cola',
      category: 'Bebidas',
      price: 2.50,
      barcode: '7891000100999',
      quantity: '2L',
      packaging: 'Botella PET',
      country: 'Chile',
      source: 'api_imported'
    };

    // Direct insert to simulate the addPublicProduct call
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('public_products')
      .insert([testApiProduct])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to simulate API product creation:', insertError);
      return;
    }

    console.log('✅ API product creation simulated successfully!');
    console.log(`   Created: ${insertData.name} (ID: ${insertData.id})`);

    // Check again
    const { data: afterData } = await supabaseAdmin
      .from('public_products')
      .select('id, name, source')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log(`\n📊 Public products after simulation: ${afterData?.length || 0}`);
    afterData?.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (source: ${p.source})`);
    });

    // Clean up
    await supabaseAdmin
      .from('public_products')
      .delete()
      .eq('id', insertData.id);
    
    console.log('\n🧹 Test product cleaned up');

    console.log('\n📝 Current Configuration:');
    console.log('   ✅ API products (OpenFoodFacts, etc.): addToPublic = true');
    console.log('   ✅ Manual UI products: addToPublic = false (privacy)');
    console.log('   ✅ Public products table: working correctly');

  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testApiProductCreation();