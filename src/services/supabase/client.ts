import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mwzdohmphqosxfzxqakp.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13emRvaG1waHFvc3hmenhxYWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDE1MjAsImV4cCI6MjA2NzQ3NzUyMH0.9j0oorHPcsBg6GEpX3CF4dUDKI9tYxdW5ieVpQ3K6yU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// TypeScript declarations for environment variables
declare global {
  interface ImportMetaEnv {
    readonly NEXT_PUBLIC_SUPABASE_URL: string;
    readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  }
} 