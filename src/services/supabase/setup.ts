import { supabase } from './client';

export const setupDatabase = async () => {
  try {
    console.log('Setting up database...');
    
    // Verificar si la tabla ws_profiles existe
    const { data: tableExists, error: checkError } = await supabase
      .from('ws_profiles')
      .select('*')
      .limit(1);

    if (checkError) {
      console.log('Table ws_profiles does not exist, creating it...');
      
      // Crear la tabla ws_profiles
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS ws_profiles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            store_types TEXT[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Habilitar RLS
          ALTER TABLE ws_profiles ENABLE ROW LEVEL SECURITY;
          
          -- Crear política para permitir todas las operaciones
          DROP POLICY IF EXISTS "Allow all operations on ws_profiles" ON ws_profiles;
          CREATE POLICY "Allow all operations on ws_profiles" ON ws_profiles FOR ALL USING (true);
        `
      });

      if (createError) {
        console.error('Error creating table:', createError);
        return { success: false, error: createError };
      }

      console.log('Table ws_profiles created successfully');
      return { success: true };
    }

    console.log('Table ws_profiles already exists');
    return { success: true };
  } catch (error) {
    console.error('Error in setupDatabase:', error);
    return { success: false, error };
  }
};

export const checkDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('ws_profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database connection error:', error);
      return { connected: false, error };
    }

    return { connected: true };
  } catch (error) {
    console.error('Error checking database connection:', error);
    return { connected: false, error };
  }
}; 