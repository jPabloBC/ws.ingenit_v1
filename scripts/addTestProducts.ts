import { supabaseAdmin } from '../src/services/supabase/admin';

async function addTestProducts() {
  try {
    console.log('📦 Adding test products to public database...');

    const testProducts = [
      {
        name: 'Leche Entera 1L',
        description: 'Leche entera pasteurizada, rica en calcio y proteínas',
        barcode: '7891000100100',
        brand: 'Soprole',
        category: 'Lacteos',
        price: 1.50,
        quantity: '1L',
        packaging: 'Tetra Pack',
        country: 'Chile',
        source: 'user_contributed'
      },
      {
        name: 'Coca Cola Original',
        description: 'Bebida gaseosa sabor cola original',
        barcode: '7894900011517',
        brand: 'Coca Cola',
        category: 'Bebidas',
        price: 2.99,
        quantity: '2L',
        packaging: 'Botella PET',
        country: 'Chile',
        source: 'user_contributed'
      },
      {
        name: 'Pan de Molde Integral',
        description: 'Pan de molde integral con fibra',
        barcode: '7123456789012',
        brand: 'Ideal',
        category: 'Panadería',
        price: 2.50,
        quantity: '500g',
        packaging: 'Bolsa',
        country: 'Chile',
        source: 'user_contributed'
      }
    ];

    for (const product of testProducts) {
      console.log(`Adding: ${product.name}...`);
      
      // Use admin client to bypass RLS for testing
      const { data, error } = await supabaseAdmin
        .from('public_products')
        .insert([product])
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Failed to add ${product.name}:`, error);
      } else {
        console.log(`✅ Added: ${data.name} (ID: ${data.id})`);
      }
    }

    console.log('\n🎉 Test products added successfully!');

  } catch (error) {
    console.error('❌ Error adding test products:', error);
  }
}

// Run the test
addTestProducts();