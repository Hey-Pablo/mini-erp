import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './client';
import type { Cliente, Pedido, ItemPedido, PedidoComItens } from '../types';

// Helper to ensure supabase is available
const getSupabase = () => {
  if (!supabase) {
    throw new Error('Banco não conectado. Configure as variáveis de ambiente.');
  }
  return supabase;
};

// Cliente hooks
export function useClientes(empresaId: string, search?: string, page?: number, pageSize?: number) {
  return useQuery({
    queryKey: ['clientes', empresaId, search, page, pageSize],
    queryFn: async (): Promise<{data: Cliente[], total: number}> => {
      const db = getSupabase();
      let query = db.from('clientes');

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
      const db = getSupabase();
      const { data, error } = await db.from('fornecedores').select('*');
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
      const db = getSupabase();
      let query = db.from('produtos');

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
      const db = getSupabase();
      let query = db
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
      const db = getSupabase();
      const { data, error } = await db
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
      const db = getSupabase();
      // Inserir pedido
      const { data: pedidoData, error: pedidoError } = await db
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

      const { error: itensError } = await db.from('itens_pedido').insert(itensComPedido);
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
      const db = getSupabase();
      const { error } = await db.rpc('faturar_pedido', {
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
      const db = getSupabase();
      const { error } = await db.rpc('cancelar_pedido', {
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
      const db = getSupabase();
      let query = db.from('titulos').select('*', { count: 'exact' });

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
    const db = getSupabase();
    const { error } = await db.rpc('baixar_titulo', {
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
      const db = getSupabase();
      const { data, error } = await db
        .from('titulos')
        .select('*')
        .neq('status', 'cancelado');
      if (error) throw error;
      return calcularFluxoCaixa(data || []);
    },
    enabled: !!empresaId,
  });
}

// Compras e estoque
import type { Compra, ItemCompra, MovimentoEstoque, ProdutoEstoque } from '../types';

export function useCompras(empresaId: string) {
  return useQuery({
    queryKey: ['compras', empresaId],
    queryFn: async (): Promise<Compra[]> => {
      const db = getSupabase();
      const { data, error } = await db
        .from('compras')
        .select('id, fornecedor, vencimento, status')
        .eq('empresa_id', empresaId)
        .order('vencimento', { ascending: true });
      if (error) throw error;
      return (data || []) as Compra[];
    },
    enabled: !!empresaId,
  });
}

export function useCreateCompra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empresaId, compra, itens }: {
      empresaId: string;
      compra: { fornecedor: string; vencimento: string };
      itens: ItemCompra[];
    }) => {
      const db = getSupabase();
      const { data, error } = await db
        .from('compras')
        .insert({ ...compra, empresa_id: empresaId, status: 'aberta' })
        .select('id')
        .single();
      if (error) throw error;

      const { error: itensError } = await db
        .from('itens_compra')
        .insert(itens.map((i) => ({ ...i, empresa_id: empresaId, compra_id: data.id })));
      if (itensError) throw itensError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
    },
  });
}

export function useReceberCompra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empresaId, compraId }: { empresaId: string; compraId: string }) => {
      const db = getSupabase();
      const { error } = await db.rpc('receber_compra', {
        p_empresa: empresaId,
        p_compra: compraId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      queryClient.invalidateQueries({ queryKey: ['movimentos-estoque'] });
      queryClient.invalidateQueries({ queryKey: ['titulos'] });
    },
  });
}

export function useProdutosEstoque(empresaId: string) {
  return useQuery({
    queryKey: ['produtos-estoque', empresaId],
    queryFn: async (): Promise<ProdutoEstoque[]> => {
      const db = getSupabase();
      const { data, error } = await db
        .from('produtos')
        .select('id, nome, estoque_minimo')
        .eq('empresa_id', empresaId)
        .order('nome', { ascending: true });
      if (error) throw error;
      return (data || []) as ProdutoEstoque[];
    },
    enabled: !!empresaId,
  });
}

export function useMovimentosEstoque(empresaId: string) {
  return useQuery({
    queryKey: ['movimentos-estoque', empresaId],
    queryFn: async (): Promise<MovimentoEstoque[]> => {
      const db = getSupabase();
      const { data, error } = await db
        .from('movimentos_estoque')
        .select('id, produto_id, quantidade, pedido_id, compra_id, criado_em')
        .eq('empresa_id', empresaId)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      return (data || []) as MovimentoEstoque[];
    },
    enabled: !!empresaId,
  });
}