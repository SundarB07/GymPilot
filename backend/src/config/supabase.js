import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// Seeding requires the service_role key to bypass RLS policies.
// Fallback to anon key for general read-only operations if service_role is not provided.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL: Missing Supabase environment variables in backend/.env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
