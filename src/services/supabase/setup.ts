import { supabaseAdmin as supabase } from './admin';

export const setupDatabase = async () => {
  try {
    console.log('Setting up database...');
    
    // Verificar si la tabla ws_users existe
    const { data: tableExists, error: checkError } = await supabase
      .from('ws_users')
      .select('*')
      .limit(1);

    if (checkError) {
      console.log('Table ws_users does not exist, creating it...');
      
      // Crear la tabla ws_users
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS ws_users (
            user_id UUID NOT NULL,
            name CHARACTER VARYING(255) NOT NULL,
            email CHARACTER VARYING(255) NOT NULL,
            store_types TEXT[] NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE NULL,
            updated_at TIMESTAMP WITHOUT TIME ZONE NULL,
            plan_id TEXT NULL,
            country_code TEXT NULL,
            currency_code TEXT NULL,
            role CHARACTER VARYING(20) NULL,
            app_id UUID NOT NULL,
            email_verified BOOLEAN NULL DEFAULT false,
            CONSTRAINT ws_users_pkey PRIMARY KEY (user_id)
          );
          
          -- Habilitar RLS
          ALTER TABLE ws_users ENABLE ROW LEVEL SECURITY;
          
          -- Crear política para permitir todas las operaciones
          DROP POLICY IF EXISTS "Allow all operations on ws_users" ON ws_users;
          CREATE POLICY "Allow all operations on ws_users" ON ws_users FOR ALL USING (true);
        `
      });

      if (createError) {
        console.error('Error creating table:', createError);
        return { success: false, error: createError };
      }

      console.log('Table ws_users created successfully');
      return { success: true };
    }

    console.log('Table ws_users already exists');
    return { success: true };
  } catch (error) {
    console.error('Error in setupDatabase:', error);
    return { success: false, error };
  }
};

export const checkDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('ws_users')
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