import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseConfig = {
  auth: {
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce'
  }
};

console.log('supabaseClient: detectSessionInUrl DESHABILITADO (manual handling)');
console.log('supabaseClient: flowType =', supabaseConfig.auth.flowType);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseConfig);