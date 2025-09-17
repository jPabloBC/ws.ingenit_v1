import { searchPublicProducts, searchPublicProductByBarcode } from '../src/services/api/publicProductsApi';
import { searchProductsFromAllApis } from '../src/services/api/productApis';

async function testPublicProducts() {
  try {
    console.log('🧪 Testing public products functionality...\n');

    // Test 1: Search public products by text
    console.log('1️⃣ Testing text search in public products...');
    const textResults = await searchPublicProducts('leche', 5);
    console.log(`Found ${textResults.length} products for "leche"`);
    textResults.forEach(p => console.log(`  - ${p.name} (${p.brand || 'Sin marca'})`));

    // Test 2: Search by barcode
    console.log('\n2️⃣ Testing barcode search in public products...');
    const barcodeResult = await searchPublicProductByBarcode('7891000100100');
    if (barcodeResult) {
      console.log(`Found product: ${barcodeResult.name}`);
    } else {
      console.log('No product found for that barcode');
    }

    // Test 3: Test integrated search (should include public products)
    console.log('\n3️⃣ Testing integrated search (includes public products)...');
    const integratedResults = await searchProductsFromAllApis({ 
      query: 'coca cola', 
      limit: 10 
    });
    console.log(`Integrated search found ${integratedResults.length} products for "coca cola"`);
    
    // Check if any come from public products
    const publicInResults = integratedResults.filter(p => p.api_name === 'Productos Públicos');
    console.log(`  - ${publicInResults.length} from public products database`);
    
    // Show a sample of results
    integratedResults.slice(0, 3).forEach(p => {
      console.log(`  - ${p.name} (${p.api_name})`);
    });

    console.log('\n✅ Public products functionality test completed!');

  } catch (error) {
    console.error('❌ Error testing public products:', error);
  }
}

// Run the test
testPublicProducts();