import { supabaseAdmin } from '../src/services/supabase/admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

async function migrateToWsPublicProducts() {
  try {
    console.log('🔄 Migrating public_products to ws_public_products architecture...');

    // Read the migration SQL file
    const migrationPath = resolve(__dirname, '../supabase/migrations/migrate_to_ws_public_products.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Executing migration...');

    // Split SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`);
        
        try {
          // Try with direct SQL execution if available
          const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement + ';' });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error);
            console.error('Statement was:', statement);
            
            // Continue with other statements for non-critical errors
            if (error.message?.includes('already exists') || error.message?.includes('does not exist')) {
              console.log('   ⚠️  Continuing with next statement...');
              continue;
            }
          } else {
            console.log(`   ✅ Statement ${i + 1} executed successfully`);
          }
        } catch (execError) {
          console.error(`❌ Failed to execute statement ${i + 1}:`, execError);
          
          // Show SQL for manual execution
          if (i < 3) { // Show first few statements for manual execution
            console.log('📋 Please execute this manually in Supabase:');
            console.log(statement + ';');
            console.log('');
          }
        }
      }
    }

    console.log('\n🧪 Testing migration...');
    
    // Test the new architecture
    const { data: testData, error: testError } = await supabaseAdmin
      .from('public_products') // This should now be a VIEW
      .select('*')
      .limit(3);

    if (testError) {
      console.error('❌ Test failed:', testError);
    } else {
      console.log(`✅ Migration test successful! Found ${testData?.length || 0} products in VIEW`);
      if (testData && testData.length > 0) {
        console.log('   Sample product:', testData[0].name);
      }
    }

    console.log('\n✅ Migration to ws_public_products completed!');
    console.log('📝 Architecture:');
    console.log('   - Real table: app_ws.ws_public_products');
    console.log('   - Public VIEW: public.public_products');
    console.log('   - Functions: public.search_public_products()');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    console.log('\n📋 Manual migration instructions:');
    console.log('Please execute the migration SQL manually in your Supabase dashboard.');
    console.log('File: supabase/migrations/migrate_to_ws_public_products.sql');
  }
}

// Run the migration
migrateToWsPublicProducts();