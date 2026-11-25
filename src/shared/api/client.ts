import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
// O banco só é considerado configurado se as variáveis de ambiente existirem
// e não forem valores de exemplo do .env.example
const getEnv = (key: string): string | undefined => {
  // @ts-ignore - Vite injects env at build time
  return import.meta.env[key];
};

// Verifica se o banco está configurado (URL e chave reais)
export const bancoConfigurado = (): boolean => {
  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');

  if (!url || !key) {
    return false;
  }

  // Valores de exemplo que indicam configuração não real
  const valoresExemplo = [
    'https://placeholder.supabase.co',
    'https://seu-projeto.supabase.co',
    'sua-chave-anon-aqui',
    'placeholder-anon-key',
  ];

  return !valoresExemplo.includes(url) && !valoresExemplo.includes(key);
};

// Cria o cliente Supabase apenas se configurado
export const createSupabaseClient = () => {
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Banco não conectado: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidas');
    return null;
  }

  const valoresExemplo = [
    'https://placeholder.supabase.co',
    'https://seu-projeto.supabase.co',
    'sua-chave-anon-aqui',
    'placeholder-anon-key',
  ];

  if (valoresExemplo.includes(supabaseUrl) || valoresExemplo.includes(supabaseAnonKey)) {
    console.warn('⚠️ Banco não conectado: valores de exemplo detectados no .env.example');
    return null;
  }

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