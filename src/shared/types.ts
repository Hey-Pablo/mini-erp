export interface Empresa {
  empresa_id: string;
  nome: string;
}

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  documento: string;
  tipo_documento: 'cpf' | 'cnpj';
}

export interface Perfil {
  empresa_id: string;
  usuario_id: string;
  papel: 'administrador' | 'vendas' | 'estoque' | 'financeiro';
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  documento: string;
  tipo_documento: 'cpf' | 'cnpj';
  telefone: string;
  endereco: string;
  ativo: boolean;
  criado_em: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  documento: string;
  tipo_documento: 'cpf' | 'cnpj';
  telefone: string;
  email: string;
  ativo: boolean;
  criado_em: string;
}

export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  preco_venda: number;
  preco_custo: number;
  unidade: string;
  estoque_atual: number;
  estoque_minimo: number;
  ativo: boolean;
  criado_em: string;
}