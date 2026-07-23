import { createClient } from '@supabase/supabase-js';

// Busca as credenciais de dentro do process.env (injetado via .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validação crucial de segurança para garantir que o app não quebre rodando sem as chaves
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Faltam as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY no seu arquivo .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);