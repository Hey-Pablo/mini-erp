import { supabase } from '@/shared/lib/supabase';
import type { Cliente, Fornecedor, Produto, PaginacaoResult, BuscaParametros, ApiResponse } from './types';

// Camada de API compartilhada - usa Supabase como backend
// Em testes, pode ser mockada via MSW ou injeção de dependência

export class ApiClient {
  // Clientes
  async getClientes(params: BuscaParametros = {}): Promise<PaginacaoResult<Cliente>> {
    const { pagina = 1, por_pagina = 10, termo, ordenar_por = 'nome', ordem = 'asc' } = params;

    let query = supabase
      .from('clientes')
      .select('*, perfis!inner(empresa_id)', { count: 'exact' })
      .order(ordenar_por, { ascending: ordem === 'asc' })
      .range((pagina - 1) * por_pagina, pagina * por_pagina - 1);

    if (termo) {
      query = query.or(`nome.ilike.%${termo}%,cpf_cnpj.ilike.%${termo}%`);
    }

    const { data, count, error } = await query;

    if (error) throw new Error(error.message);

    return {
      data: data || [],
      total: count || 0,
      pagina,
      por_pagina,
      total_paginas: Math.ceil((count || 0) / por_pagina),
    };
  }

  async getCliente(id: string): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async createCliente(cliente: Omit<Cliente, 'id' | 'criado_em' | 'atualizado_em'>): Promise<Cliente> {
    const { data, error } = await supabase.from('clientes').insert(cliente).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateCliente(id: string, cliente: Partial<Cliente>): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .update({ ...cliente, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteCliente(id: string): Promise<void> {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  // Fornecedores
  async getFornecedores(params: BuscaParametros = {}): Promise<PaginacaoResult<Fornecedor>> {
    const { pagina = 1, por_pagina = 10, termo, ordenar_por = 'nome', ordem = 'asc' } = params;

    let query = supabase
      .from('fornecedores')
      .select('*, perfis!inner(empresa_id)', { count: 'exact' })
      .order(ordenar_por, { ascending: ordem === 'asc' })
      .range((pagina - 1) * por_pagina, pagina * pagina - 1);

    if (termo) {
      query = query.or(`nome.ilike.%${termo}%,cpf_cnpj.ilike.%${termo}%`);
    }

    const { data, count, error } = await query;

    if (error) throw new Error(error.message);

    return {
      data: data || [],
      total: count || 0,
      pagina,
      por_pagina,
      total_paginas: Math.ceil((count || 0) / por_pagina),
    };
  }

  // Produtos
  async getProdutos(params: BuscaParametros = {}): Promise<PaginacaoResult<Produto>> {
    const { pagina = 1, por_pagina = 10, termo, ordenar_por = 'nome', ordem = 'asc' } = params;

    let query = supabase
      .from('produtos')
      .select('*, perfis!inner(empresa_id)', { count: 'exact' })
      .order(ordenar_por, { ascending: ordem === 'asc' })
      .range((pagina - 1) * por_pagina, pagina * por_pagina - 1);

    if (termo) {
      query = query.or(`nome.ilike.%${termo}%,codigo.ilike.%${termo}%`);
    }

    const { data, count, error } = await query;

    if (error) throw new Error(error.message);

    return {
      data: data || [],
      total: count || 0,
      pagina,
      por_pagina,
      total_paginas: Math.ceil((count || 0) / por_pagina),
    };
  }
}

// Singleton para uso global
export const apiClient = new ApiClient();