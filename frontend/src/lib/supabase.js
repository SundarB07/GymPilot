import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Anon Key is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.'
  )
}

const url = supabaseUrl || 'https://placeholder-please-set-env-vars.supabase.co'
const key = supabaseAnonKey || 'placeholder-key'

export const supabase = createClient(url, key)

