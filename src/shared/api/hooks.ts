import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './client';
import type { Cliente, Pedido, ItemPedido, PedidoComItens } from '../types';

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

// Pedido hooks
export function usePedidos(empresaId: string, search?: string, page?: number, pageSize?: number) {
  return useQuery({
    queryKey: ['pedidos', empresaId, search, page, pageSize],
    queryFn: async (): Promise<{data: PedidoComItens[], total: number}> => {
      let query = supabase
        .from('pedidos')
        .select(`
          *,
          itens_pedido (
            *,
            produtos (id, nome, codigo, preco_venda, unidade)
          )
        `)
        .order('criado_em', { ascending: false });

      if (search) {
        query = query.or(`cliente.ilike.%${search}%,id.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data: (data || []) as unknown as PedidoComItens[], total: (data || []).length };
    },
    enabled: !!empresaId,
  });
}

export function usePedido(empresaId: string, pedidoId: string) {
  return useQuery({
    queryKey: ['pedido', empresaId, pedidoId],
    queryFn: async (): Promise<PedidoComItens | null> => {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          itens_pedido (
            *,
            produtos (id, nome, codigo, preco_venda, unidade)
          )
        `)
        .eq('id', pedidoId)
        .eq('empresa_id', empresaId)
        .single();
      if (error) throw error;
      return data as unknown as PedidoComItens;
    },
    enabled: !!empresaId && !!pedidoId,
  });
}

export function useCreatePedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empresaId, pedido, itens }: { empresaId: string; pedido: Omit<Pedido, 'empresa_id' | 'id' | 'status' | 'criado_em'>; itens: Omit<ItemPedido, 'empresa_id' | 'pedido_id'>[] }) => {
      // Inserir pedido
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({ ...pedido, empresa_id: empresaId, status: 'aberto' })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // Inserir itens
      const itensComPedido = itens.map(item => ({
        ...item,
        empresa_id: empresaId,
        pedido_id: pedidoData.id,
      }));

      const { error: itensError } = await supabase.from('itens_pedido').insert(itensComPedido);
      if (itensError) throw itensError;

      return pedidoData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
  });
}

export function useFaturarPedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empresaId, pedidoId }: { empresaId: string; pedidoId: string }) => {
      const { error } = await supabase.rpc('faturar_pedido', {
        p_empresa: empresaId,
        p_pedido: pedidoId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
  });
}

export function useCancelarPedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empresaId, pedidoId }: { empresaId: string; pedidoId: string }) => {
      const { error } = await supabase.rpc('cancelar_pedido', {
        p_empresa: empresaId,
        p_pedido: pedidoId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
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