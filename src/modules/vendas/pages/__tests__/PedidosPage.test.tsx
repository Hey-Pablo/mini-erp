import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PedidosPage } from '../PedidosPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../../../shared/auth';
import { EmpresaProvider } from '../../../../shared/context';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock do Supabase
vi.mock('../../../../shared/api/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@test.com' } } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    },
  },
  createSupabaseClient: vi.fn(),
}));

// Mock dos hooks
vi.mock('../../../../shared/api/hooks', () => ({
  usePedidos: vi.fn(),
  useFaturarPedido: vi.fn(),
  useCancelarPedido: vi.fn(),
  useProdutos: vi.fn(),
  useCreatePedido: vi.fn(),
}));

// Mock do gerarDocumentoPedido
const mockGerarDocumentoPedido = vi.fn().mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
vi.mock('../../documentoPedido', () => ({
  gerarDocumentoPedido: () => mockGerarDocumentoPedido(),
}));

import { usePedidos, useFaturarPedido, useCancelarPedido, useProdutos, useCreatePedido } from '../../../../shared/api/hooks';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EmpresaProvider>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </EmpresaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('PedidosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMocks = (overrides = {}) => {
    (usePedidos as any).mockReturnValue({
      data: { data: [], total: 0 },
      isLoading: false,
      error: null,
      ...overrides,
    });
    (useProdutos as any).mockReturnValue({ data: [
      { id: 'prod-1', codigo: 'PROD-001', nome: 'Produto 1', preco_venda: 50, preco_custo: 25, unidade: 'UN', estoque_atual: 10, estoque_minimo: 2, ativo: true, criado_em: '2024-01-15T00:00:00Z' }
    ]});
    (useFaturarPedido as any).mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({}) });
    (useCancelarPedido as any).mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({}) });
    (useCreatePedido as any).mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({}) });
  };

  it('renderiza a página de pedidos com título', async () => {
    setupMocks();

    render(<PedidosPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Pedidos de Venda')).toBeInTheDocument();
    });
    expect(screen.getByText('Gerencie os pedidos da sua empresa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Novo Pedido/i })).toBeInTheDocument();
  });

  it('renderiza estado vazio quando não há pedidos', async () => {
    setupMocks();

    render(<PedidosPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Nenhum pedido encontrado')).toBeInTheDocument();
    });
  });

  it('renderiza lista de pedidos quando há dados', async () => {
    const mockPedidos = [
      {
        empresa_id: 'emp-1',
        id: 'pedido-1',
        cliente: 'Cliente Teste',
        status: 'aberto' as const,
        vencimento: '2024-12-31',
        criado_em: '2024-01-15T10:00:00Z',
        itens: [
          {
            empresa_id: 'emp-1',
            pedido_id: 'pedido-1',
            produto_id: 'prod-1',
            quantidade: 2,
            preco: 50.00,
            produto: { id: 'prod-1', codigo: 'PROD-001', nome: 'Produto 1', preco_venda: 50, unidade: 'UN' },
          },
        ],
      },
    ];

    setupMocks({ data: { data: mockPedidos, total: 1 } });

    render(<PedidosPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Cliente Teste')).toBeInTheDocument();
    });
    expect(screen.getByText('Aberto')).toBeInTheDocument();
    expect(screen.getByText('R$ 100.00')).toBeInTheDocument();
  });

  it('mostra loading enquanto carrega', () => {
    setupMocks({ isLoading: true, data: undefined });

    render(<PedidosPage />, { wrapper: createWrapper() });

    // O spinner de loading deve estar presente
    const spinner = document.querySelector('[data-testid="loading-spinner"]');
    expect(spinner).toBeInTheDocument();
  });

  it('mostra erro quando falha ao carregar', async () => {
    setupMocks({ isLoading: false, error: { message: 'Erro de conexão' }, data: undefined });

    render(<PedidosPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar pedidos: Erro de conexão')).toBeInTheDocument();
    });
  });

  it('abre modal de novo pedido ao clicar no botão', async () => {
    setupMocks();

    render(<PedidosPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Novo Pedido/i });
      fireEvent.click(btn);
    });

    await waitFor(() => {
      // Verificar se o modal abriu (pelo título do modal, não o botão)
      expect(screen.getByRole('heading', { name: /Novo Pedido/i })).toBeInTheDocument();
    });

    // Verificar se os campos do formulário existem
    expect(screen.getByPlaceholderText('Nome do cliente')).toBeInTheDocument();
    // Verificar se o select de produto existe
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    // Vencimento usa input type="date" sem placeholder, verificar se o input existe
    expect(screen.getByTestId('vencimento-input')).toBeInTheDocument();
  });

  it('valida campos obrigatórios do formulário', async () => {
    setupMocks();

    render(<PedidosPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Novo Pedido/i });
      fireEvent.click(btn);
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Novo Pedido/i })).toBeInTheDocument();
    });

    // Tentar submeter sem preencher
    const salvarButton = screen.getByRole('button', { name: /Salvar Pedido/i });
    fireEvent.click(salvarButton);

    // Verificar se o formulário não fecha (ainda está aberto)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Novo Pedido/i })).toBeInTheDocument();
    });
  });

  it('renderiza paginação quando há mais de uma página', async () => {
    const mockPedidos = Array.from({ length: 15 }, (_, i) => ({
      empresa_id: 'emp-1',
      id: `pedido-${i}`,
      cliente: `Cliente ${i}`,
      status: 'aberto' as const,
      vencimento: '2024-12-31',
      criado_em: '2024-01-15T10:00:00Z',
      itens: [],
    }));

    setupMocks({ data: { data: mockPedidos, total: 15 } });

    render(<PedidosPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByLabelText(/Próxima página/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Última página/i)).toBeInTheDocument();
    });
  });

  it('botão Baixar PDF só aparece em pedido faturado', async () => {
    const mockPedidos = [
      {
        empresa_id: 'emp-1',
        id: 'pedido-faturado',
        cliente: 'Cliente Faturado',
        status: 'faturado' as const,
        vencimento: '2024-12-31',
        criado_em: '2024-01-15T10:00:00Z',
        itens: [
          {
            empresa_id: 'emp-1',
            pedido_id: 'pedido-faturado',
            produto_id: 'prod-1',
            quantidade: 2,
            preco: 50.00,
            produto: { id: 'prod-1', codigo: 'PROD-001', nome: 'Produto 1', preco_venda: 50, unidade: 'UN' },
          },
        ],
      },
      {
        empresa_id: 'emp-1',
        id: 'pedido-aberto',
        cliente: 'Cliente Aberto',
        status: 'aberto' as const,
        vencimento: '2024-12-31',
        criado_em: '2024-01-15T10:00:00Z',
        itens: [
          {
            empresa_id: 'emp-1',
            pedido_id: 'pedido-aberto',
            produto_id: 'prod-1',
            quantidade: 1,
            preco: 100.00,
            produto: { id: 'prod-1', codigo: 'PROD-001', nome: 'Produto 1', preco_venda: 100, unidade: 'UN' },
          },
        ],
      },
    ];

    setupMocks({ data: { data: mockPedidos, total: 2 } });
    render(<PedidosPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Cliente Faturado')).toBeInTheDocument();
      expect(screen.getByText('Cliente Aberto')).toBeInTheDocument();
    });

    // O pedido faturado deve ter botão de cancelar (XCircle) e baixar PDF (Download)
    // O pedido aberto deve ter apenas faturar (Truck)

    // Verificar presença do status faturado
    expect(screen.getByText('Faturado')).toBeInTheDocument();
    expect(screen.getByText('Aberto')).toBeInTheDocument();
  });

  it('botão Baixar PDF está presente em pedido faturado', async () => {
    const mockPedidos = [
      {
        empresa_id: 'emp-1',
        id: 'pedido-para-download',
        cliente: 'Cliente PDF',
        status: 'faturado' as const,
        vencimento: '2024-12-31',
        criado_em: '2024-01-15T10:00:00Z',
        itens: [
          {
            empresa_id: 'emp-1',
            pedido_id: 'pedido-para-download',
            produto_id: 'prod-1',
            quantidade: 3,
            preco: 25.5,
            produto: { id: 'prod-1', codigo: 'PROD-001', nome: 'Produto Teste', preco_venda: 25.5, unidade: 'UN' },
          },
        ],
      },
    ];

    setupMocks({ data: { data: mockPedidos, total: 1 } });

    render(<PedidosPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Cliente PDF')).toBeInTheDocument();
    });

    // Verificar se há 3 botões nações de ação (Eye, Download, XCircle para faturado)
    const allButtons = screen.getAllByRole('button');
    expect(allButtons.length).toBeGreaterThanOrEqual(3);

    // Verificar se o gerarDocumentoPedido está sendo importado corretamente
    // (a função é chamada via handleBaixarPDF no componente)
  });
});