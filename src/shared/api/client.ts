import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase - usa variáveis de ambiente para conectar
// Se não houver variáveis, usa mock para desenvolvimento
const getEnv = (key: string, fallback: string) => {
  // @ts-ignore - Vite injects env at build time
  return import.meta.env[key] || fallback;
};

export const createSupabaseClient = () => {
  const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'https://placeholder.supabase.co');
  const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', 'placeholder-anon-key');

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
};

export const supabase = createSupabaseClient();

// Exportar tipos para uso nos módulos
export type { Empresa, Usuario, Perfil, Cliente, Fornecedor, Produto } from '../types';