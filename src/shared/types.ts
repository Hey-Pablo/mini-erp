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
  empresa_id?: string;
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

export interface Compra {
  id: string;
  empresa_id: string;
  fornecedor: string;
  vencimento: string;
  status: 'aberta' | 'recebida';
  criado_em: string;
}

export interface ItemCompra {
  empresa_id: string;
  compra_id: string;
  produto_id: string;
  quantidade: number;
  preco: number;
}

export interface MovimentoEstoque {
  empresa_id: string;
  id: string;
  produto_id: string;
  quantidade: number;
  pedido_id: string | null;
  compra_id: string | null;
  criado_em: string;
}

export interface SaldoEstoque {
  empresa_id: string;
  produto_id: string;
  nome: string;
  estoque_minimo: number;
  saldo: number;
  estoque_baixo: boolean;
}