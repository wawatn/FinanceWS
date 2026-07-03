import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('seu-projeto') || supabaseAnonKey.includes('sua-chave-anon')) {
  console.warn(
    'Supabase: URL ou Chave Anon não configuradas. Por favor, edite o arquivo .env com suas chaves reais do Supabase.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
