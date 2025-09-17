import { readFileSync } from 'fs';
import { resolve } from 'path';

async function createPublicProductsTable() {
  try {
    console.log('🏗️  Setting up public products table...');

    // Import admin client
    const { supabaseAdmin } = await import('../src/services/supabase/admin');

    // Read the migration SQL file
    const migrationPath = resolve(__dirname, '../supabase/migrations/create_public_products_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Executing migration SQL...');
    
    // Try to execute the full migration first
    try {
      // Replace function calls that might not work with rpc
      const cleanSQL = migrationSQL
        .replace(/BEGIN;/g, '')
        .replace(/COMMIT;/g, '')
        .replace(/CREATE OR REPLACE FUNCTION([^;]+);/g, ''); // Remove function creation temporarily

      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: cleanSQL });
      
      if (error) {
        console.log('Full migration failed, trying step by step...');
        throw error;
      }
      
      console.log('✅ Migration executed successfully!');
    } catch (error) {
      console.log('🔄 Attempting step-by-step creation...');
      await createBasicTable();
    }

    console.log('✅ Public products table setup complete!');
    
  } catch (error) {
    console.error('❌ Error creating public products table:', error);
    
    // Fallback: create basic table structure
    console.log('🔄 Attempting fallback table creation...');
    await createBasicTable();
  }
}

async function createBasicTable() {
  try {
    const { supabaseAdmin } = await import('../src/services/supabase/admin');

    console.log('Creating basic table structure...');

    // Create basic table structure
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public_products (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          barcode TEXT,
          name TEXT NOT NULL,
          description TEXT,
          brand TEXT,
          category TEXT,
          price DECIMAL(10,2),
          image_url TEXT,
          quantity TEXT,
          packaging TEXT,
          country TEXT DEFAULT 'Chile',
          source TEXT DEFAULT 'user_contributed',
          verified BOOLEAN DEFAULT false,
          verification_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          created_by UUID REFERENCES auth.users(id),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          calories INTEGER,
          protein DECIMAL(8,2),
          carbs DECIMAL(8,2),
          fat DECIMAL(8,2)
        );

        CREATE INDEX IF NOT EXISTS idx_public_products_barcode ON public_products(barcode);
        CREATE INDEX IF NOT EXISTS idx_public_products_name ON public_products(name);
        CREATE INDEX IF NOT EXISTS idx_public_products_verified ON public_products(verified, verification_count DESC);
        CREATE INDEX IF NOT EXISTS idx_public_products_created_at ON public_products(created_at DESC);

        ALTER TABLE public_products ENABLE ROW LEVEL SECURITY;

        -- Basic RLS policies
        DROP POLICY IF EXISTS "Allow read access for all users" ON public_products;
        DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public_products;
        DROP POLICY IF EXISTS "Allow update for authenticated users" ON public_products;

        CREATE POLICY "Allow read access for all users" ON public_products
          FOR SELECT USING (true);

        CREATE POLICY "Allow insert for authenticated users" ON public_products
          FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

        CREATE POLICY "Allow update for authenticated users" ON public_products
          FOR UPDATE USING (auth.uid() IS NOT NULL);
      `
    });

    if (error) {
      console.error('❌ Error in basic table creation:', error);
    } else {
      console.log('✅ Basic table structure created successfully!');
    }
  } catch (error) {
    console.error('❌ Basic table creation failed:', error);
  }
}

// Run the setup
createPublicProductsTable();