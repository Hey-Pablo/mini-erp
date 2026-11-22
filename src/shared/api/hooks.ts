import { useQuery } from '@tanstack/react-query';
import { supabase } from './client';
import type { Cliente } from '../types';

// Cliente hooks
export function useClientes(empresaId: string, search?: string, page?: number, pageSize?: number) {
  return useQuery({
    queryKey: ['clientes', empresaId, search, page, pageSize],
    queryFn: async (): Promise<{data: Cliente[], total: number}> => {
      let query = supabase.from('clientes');

      if (search) {
        // @ts-expect-error - Postgrest types don't include .or() but it exists at runtime
        query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query.select('*');
      if (error) throw error;
      return { data: data || [], total: (data || []).length };
    },
    enabled: !!empresaId,
  });
}

export function useCreateCliente() {
  // Implementação placeholder - usar mutation quando tivermos a tabela criada
  return { mutate: async () => {} };
}

// Fornecedor hooks
export function useFornecedores(empresaId: string) {
  return useQuery({
    queryKey: ['fornecedores', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase.from('fornecedores').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });
}

// Produto hooks
export function useProdutos(empresaId: string, search?: string) {
  return useQuery({
    queryKey: ['produtos', empresaId, search],
    queryFn: async () => {
      let query = supabase.from('produtos');

      if (search) {
        // @ts-expect-error - Postgrest types don't include .or() but it exists at runtime
        query = query.or(`nome.ilike.%${search}%,codigo.ilike.%${search}%`);
      }

      const { data, error } = await query.select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });
}

// Titulo hooks
import type { Titulo, FluxoCaixaItem } from '../types';

export function useTitulos(
  empresaId: string,
  filters?: { tipo?: 'pagar' | 'receber'; status?: 'aberto' | 'baixado' | 'cancelado' },
  page?: number,
  pageSize?: number
) {
  return useQuery({
    queryKey: ['titulos', empresaId, filters, page, pageSize],
    queryFn: async (): Promise<{ data: Titulo[]; total: number }> => {
      let query = supabase.from('titulos').select('*', { count: 'exact' });

      if (filters?.tipo) {
        query = query.eq('tipo', filters.tipo);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      // Paginação
      const from = (page || 1 - 1) * (pageSize || 10);
      const to = from + (pageSize || 10) - 1;
      query = query.range(from, to).order('vencimento', { ascending: true });

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data || [], total: count || 0 };
    },
    enabled: !!empresaId,
  });
}

export function useBaixarTitulo() {
  return async (empresaId: string, tituloId: string): Promise<void> => {
    const { error } = await supabase.rpc('baixar_titulo', {
      p_empresa: empresaId,
      p_titulo: tituloId,
    });
    if (error) throw error;
  };
}

// Fluxo de Caixa - função pura para agregação
export function calcularFluxoCaixa(titulos: Titulo[]): FluxoCaixaItem[] {
  const agrupado = new Map<string, { total_pagar: number; total_receber: number }>();

  for (const t of titulos) {
    if (t.status === 'cancelado') continue;

    const key = t.vencimento;
    const atual = agrupado.get(key) || { total_pagar: 0, total_receber: 0 };

    if (t.tipo === 'pagar') {
      atual.total_pagar += t.valor;
    } else {
      atual.total_receber += t.valor;
    }

    agrupado.set(key, atual);
  }

  // Ordenar por vencimento e calcular saldo acumulado
  const ordenado = Array.from(agrupado.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([vencimento, valores]) => ({
      vencimento,
      total_pagar: valores.total_pagar,
      total_receber: valores.total_receber,
      saldo: valores.total_receber - valores.total_pagar,
    }));

  return ordenado;
}

export function useFluxoCaixa(empresaId: string) {
  return useQuery({
    queryKey: ['fluxo-caixa', empresaId],
    queryFn: async (): Promise<FluxoCaixaItem[]> => {
      const { data, error } = await supabase
        .from('titulos')
        .select('*')
        .neq('status', 'cancelado');
      if (error) throw error;
      return calcularFluxoCaixa(data || []);
    },
    enabled: !!empresaId,
  });
}