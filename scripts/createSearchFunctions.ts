import { supabaseAdmin } from '../src/services/supabase/admin';

async function createSearchFunctions() {
  try {
    console.log('🔧 Creating search functions for public products...');

    // Create search function for text search
    console.log('Creating search_public_products function...');
    const searchFunctionSQL = `
      CREATE OR REPLACE FUNCTION search_public_products(search_term text, limit_count integer)
      RETURNS TABLE (
        id UUID,
        barcode TEXT,
        name TEXT,
        description TEXT,
        brand TEXT,
        category TEXT,
        price DECIMAL(10,2),
        image_url TEXT,
        quantity TEXT,
        packaging TEXT,
        country TEXT,
        source TEXT,
        verified BOOLEAN,
        verification_count INTEGER,
        created_at TIMESTAMP WITH TIME ZONE,
        created_by UUID,
        updated_at TIMESTAMP WITH TIME ZONE,
        calories INTEGER,
        protein DECIMAL(8,2),
        carbs DECIMAL(8,2),
        fat DECIMAL(8,2)
      )
      LANGUAGE sql
      AS $$
        SELECT 
          id, barcode, name, description, brand, category, price, image_url,
          quantity, packaging, country, source, verified, verification_count,
          created_at, created_by, updated_at, calories, protein, carbs, fat
        FROM public_products
        WHERE 
          name ILIKE '%' || search_term || '%' OR
          description ILIKE '%' || search_term || '%' OR
          brand ILIKE '%' || search_term || '%' OR
          category ILIKE '%' || search_term || '%'
        ORDER BY verified DESC, verification_count DESC, created_at DESC
        LIMIT limit_count;
      $$;
    `;

    // Create barcode search function
    console.log('Creating search_public_products_by_barcode function...');
    const barcodeSearchSQL = `
      CREATE OR REPLACE FUNCTION search_public_products_by_barcode(barcode_input text)
      RETURNS TABLE (
        id UUID,
        barcode TEXT,
        name TEXT,
        description TEXT,
        brand TEXT,
        category TEXT,
        price DECIMAL(10,2),
        image_url TEXT,
        quantity TEXT,
        packaging TEXT,
        country TEXT,
        source TEXT,
        verified BOOLEAN,
        verification_count INTEGER,
        created_at TIMESTAMP WITH TIME ZONE,
        created_by UUID,
        updated_at TIMESTAMP WITH TIME ZONE,
        calories INTEGER,
        protein DECIMAL(8,2),
        carbs DECIMAL(8,2),
        fat DECIMAL(8,2)
      )
      LANGUAGE sql
      AS $$
        SELECT 
          id, barcode, name, description, brand, category, price, image_url,
          quantity, packaging, country, source, verified, verification_count,
          created_at, created_by, updated_at, calories, protein, carbs, fat
        FROM public_products
        WHERE barcode = barcode_input
        ORDER BY verified DESC, verification_count DESC
        LIMIT 1;
      $$;
    `;

    // Try to create search function
    try {
      const { error: searchError } = await supabaseAdmin.rpc('exec_sql', { sql: searchFunctionSQL });
      if (searchError) {
        console.error('❌ Error creating search function via exec_sql:', searchError);
      } else {
        console.log('✅ Search function created successfully');
      }
    } catch (error) {
      console.log('❌ exec_sql not available, showing manual SQL...');
    }

    // Try to create barcode search function
    try {
      const { error: barcodeError } = await supabaseAdmin.rpc('exec_sql', { sql: barcodeSearchSQL });
      if (barcodeError) {
        console.error('❌ Error creating barcode search function via exec_sql:', barcodeError);
      } else {
        console.log('✅ Barcode search function created successfully');
      }
    } catch (error) {
      console.log('❌ exec_sql not available for barcode function');
    }

    console.log('\n📋 If automatic creation failed, please run this SQL manually in Supabase:');
    console.log('='.repeat(80));
    console.log(searchFunctionSQL);
    console.log('\n-- Barcode search function:');
    console.log(barcodeSearchSQL);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error creating functions:', error);
  }
}

// Run the function creation
createSearchFunctions();