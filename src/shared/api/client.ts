import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase - usa variáveis de ambiente para conectar
// Se não houver variáveis, usa mock para desenvolvimento
export const createSupabaseClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

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