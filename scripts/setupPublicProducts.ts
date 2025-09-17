import { supabaseAdmin } from '../src/services/supabase/admin';

async function createPublicProductsTable() {
  try {
    console.log('🏗️  Setting up public products table...');

    // Test connection first
    console.log('🔌 Testing database connection...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('ws_users')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }

    console.log('✅ Database connected successfully');

    // Check if table exists
    console.log('🔍 Checking if public_products table exists...');
    const { data: existingTable, error: checkError } = await supabaseAdmin
      .from('public_products')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('✅ public_products table already exists!');
      return;
    }

    console.log('📋 Table does not exist, creating manually...');

    // Since exec_sql doesn't exist, we'll use a different approach
    // Let's try using the SQL editor endpoint directly or create via client
    
    console.log('💡 Creating table using direct SQL execution...');
    
    // Try using the direct SQL approach
    const createTableSQL = `
      CREATE TABLE public_products (
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
    `;

    // Try using the raw SQL approach
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('❌ Failed to create table via exec_sql:', error);
      
      // Alternative: show instructions for manual creation
      console.log('\n📋 Manual Setup Instructions:');
      console.log('='.repeat(50));
      console.log('Since automatic table creation failed, please run the following SQL manually in your Supabase dashboard:');
      console.log('\n' + createTableSQL);
      console.log('\n-- Create indexes');
      console.log('CREATE INDEX idx_public_products_barcode ON public_products(barcode);');
      console.log('CREATE INDEX idx_public_products_name ON public_products(name);');
      console.log('CREATE INDEX idx_public_products_verified ON public_products(verified, verification_count DESC);');
      console.log('\n-- Enable RLS');
      console.log('ALTER TABLE public_products ENABLE ROW LEVEL SECURITY;');
      console.log('\n-- Create policies');
      console.log('CREATE POLICY "Allow read access" ON public_products FOR SELECT USING (true);');
      console.log('CREATE POLICY "Allow insert for auth users" ON public_products FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);');
      console.log('\n' + '='.repeat(50));
      
      return;
    }

    console.log('✅ Table created successfully!');

  } catch (error) {
    console.error('❌ Error during setup:', error);
    
    // Show manual instructions as fallback
    console.log('\n📋 Please create the table manually in Supabase dashboard with this SQL:');
    console.log(`
      CREATE TABLE public_products (
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

      CREATE INDEX idx_public_products_barcode ON public_products(barcode);
      CREATE INDEX idx_public_products_name ON public_products(name);
      CREATE INDEX idx_public_products_verified ON public_products(verified, verification_count DESC);

      ALTER TABLE public_products ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "Allow read access" ON public_products FOR SELECT USING (true);
      CREATE POLICY "Allow insert for auth users" ON public_products FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    `);
  }
}

// Run the setup
createPublicProductsTable();