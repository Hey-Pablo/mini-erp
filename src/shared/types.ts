export type Papel = 'administrador' | 'vendas' | 'estoque' | 'financeiro';

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  empresa_id: string;
  nome: string;
  documento: string;
  tipo_documento: 'cpf' | 'cnpj';
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Fornecedor {
  id: string;
  empresa_id: string;
  nome: string;
  documento: string;
  tipo_documento: 'cpf' | 'cnpj';
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Produto {
  id: string;
  empresa_id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  ncm?: string;
  cfop_padrao?: string;
  unidade: string;
  preco_custo: number;
  preco_venda: number;
  estoque_minimo: number;
  estoque_atual: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export type StatusPedido = 'rascunho' | 'emitido' | 'faturado' | 'cancelado';

export interface Pedido {
  id: string;
  empresa_id: string;
  cliente_id: string;
  numero: number;
  status: StatusPedido;
  data_emissao: string;
  data_faturamento?: string;
  observacoes?: string;
  subtotal: number;
  desconto: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface PedidoItem {
  id: string;
  pedido_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
  total: number;
  created_at: string;
}

export type StatusCompra = 'rascunho' | 'emitida' | 'recebida' | 'cancelada';

export interface Compra {
  id: string;
  empresa_id: string;
  fornecedor_id: string;
  numero: number;
  status: StatusCompra;
  data_emissao: string;
  data_recebimento?: string;
  observacoes?: string;
  subtotal: number;
  desconto: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export type TipoMovimento = 'entrada' | 'saida' | 'ajuste' | 'devolucao';

export interface EstoqueMovimento {
  id: string;
  empresa_id: string;
  produto_id: string;
  tipo: TipoMovimento;
  quantidade: number;
  custo_unitario: number;
  documento_tipo?: string;
  documento_id?: string;
  observacoes?: string;
  created_at: string;
}

export interface EstoqueSaldo {
  produto_id: string;
  empresa_id: string;
  quantidade: number;
  valor_total: number;
  updated_at: string;
}

export type TipoTitulo = 'pagar' | 'receber';
export type StatusTitulo = 'aberto' | 'parcial' | 'quitado' | 'cancelado' | 'vencido';

export interface Titulo {
  id: string;
  empresa_id: string;
  tipo: TipoTitulo;
  documento_tipo: string;
  documento_id: string;
  parcela: number;
  valor: number;
  valor_aberto: number;
  data_emissao: string;
  data_vencimento: string;
  data_baixa?: string;
  status: StatusTitulo;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface FluxoCaixa {
  id: string;
  empresa_id: string;
  data: string;
  tipo: 'entrada' | 'saida';
  categoria: string;
  descricao: string;
  valor: number;
  documento_tipo?: string;
  documento_id?: string;
  created_at: string;
}
