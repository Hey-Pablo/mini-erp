// Tipos baseados no modelo multiempresa do P12
// Todas as tabelas possuem empresa_id para isolamento entre empresas

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  inscricao_estadual?: string;
  endereco?: string;
  criado_em: string;
}

export interface Cliente {
  id: string;
  empresa_id: string;
  nome: string;
  tipo_pessoa: 'F' | 'J';
  cpf_cnpj: string;
  ie?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em?: string;
  // Campos calculados
  nome_fantasia?: string;
}

export interface Fornecedor {
  id: string;
  empresa_id: string;
  nome: string;
  tipo_pessoa: 'F' | 'J';
  cpf_cnpj: string;
  ie?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em?: string;
}

export interface Produto {
  id: string;
  empresa_id: string;
  codigo?: string;
  nome: string;
  descricao?: string;
  unidade: string;
  preco_venda: number;
  preco_custo?: number;
  estoque_minimo?: number;
  estoque_atual?: number;
  ativo: boolean;
  ncm?: string;
  criado_em: string;
  atualizado_em?: string;
}

export interface PaginacaoResult<T> {
  data: T[];
  total: number;
  pagina: number;
  por_pagina: number;
  total_paginas: number;
}

// Parâmetros comuns para busca e paginação
export interface BuscaParametros {
  pagina?: number;
  por_pagina?: number;
  termo?: string;
  ordenar_por?: string;
  ordem?: 'asc' | 'desc';
}

// Resposta padrão da API
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Erro de validação
export interface ValidationError {
  campo: string;
  mensagem: string;
}