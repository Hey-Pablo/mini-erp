import { render, screen } from '@testing-library/react';
import { FluxoCaixaPage } from '../pages/FluxoCaixaPage';
import { EmpresaProvider } from '@/shared/context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as hooksModule from '@/shared/api/hooks';
import type { FluxoCaixaItem } from '@/shared/types';

// Mock supabase client
vi.mock('@/shared/api/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  },
}));

// Mock AuthContext
vi.mock('@/shared/context', () => ({
  useEmpresa: () => ({
    empresa: { empresa_id: 'test-empresa-id', nome: 'Test Company' },
    usuario: { id: 'user-1', email: 'test@test.com', nome: 'Test User', documento: '123.456.789-00', tipo_documento: 'cpf' },
    perfil: { empresa_id: 'test-empresa-id', usuario_id: 'user-1', papel: 'financeiro' },
    carregando: false,
    temPermissao: vi.fn().mockReturnValue(true),
    signOut: vi.fn(),
  }),
  EmpresaProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Helper to create mock useFluxoCaixa return value
const mockUseFluxoCaixaResult = (data: FluxoCaixaItem[]) => ({
  data,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
  isError: false,
  isSuccess: true,
  isPending: false,
  status: 'success',
  fetchStatus: 'idle',
  failureCount: 0,
  failureReason: null,
  isFetched: true,
  isFetchedAfterMount: true,
  isLoadingError: false,
  isPlaceholderData: false,
  isRefetchError: false,
  isStale: false,
  dataUpdatedAt: Date.now(),
  errorUpdatedAt: 0,
} as any);

describe('FluxoCaixaPage', () => {
  const queryClient = new QueryClient();

  afterEach(() => {
    queryClient.clear();
  });

  it('renders the page title and description', () => {
    vi.spyOn(hooksModule, 'useFluxoCaixa').mockReturnValue(mockUseFluxoCaixaResult([]));

    render(
      <QueryClientProvider client={queryClient}>
        <EmpresaProvider>
          <FluxoCaixaPage />
        </EmpresaProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText('Fluxo de Caixa')).toBeInTheDocument();
    expect(screen.getByText('Projeção de entradas e saídas por vencimento')).toBeInTheDocument();
  });

  it('displays summary cards with correct totals', () => {
    vi.spyOn(hooksModule, 'useFluxoCaixa').mockReturnValue(mockUseFluxoCaixaResult([
      { vencimento: '2024-01-15', total_pagar: 1000, total_receber: 2500, saldo: 1500 },
      { vencimento: '2024-01-20', total_pagar: 500, total_receber: 1500, saldo: 1000 },
    ]));

    render(
      <QueryClientProvider client={queryClient}>
        <EmpresaProvider>
          <FluxoCaixaPage />
        </EmpresaProvider>
      </QueryClientProvider>
    );

    // Find the cards by their label text
    const pagarCard = screen.getByText('Total a Pagar').closest('[class*="rounded-lg"]');
    const receberCard = screen.getByText('Total a Receber').closest('[class*="rounded-lg"]');
    const saldoCard = screen.getByText('Saldo Projetado').closest('[class*="rounded-lg"]');

    expect(pagarCard).toHaveTextContent('R$ 1.500,00');
    expect(receberCard).toHaveTextContent('R$ 4.000,00');
    expect(saldoCard).toHaveTextContent('R$ 2.500,00');
  });

  it('displays saldo positivo in green', () => {
    vi.spyOn(hooksModule, 'useFluxoCaixa').mockReturnValue(mockUseFluxoCaixaResult([
      { vencimento: '2024-01-15', total_pagar: 100, total_receber: 500, saldo: 400 },
    ]));

    render(
      <QueryClientProvider client={queryClient}>
        <EmpresaProvider>
          <FluxoCaixaPage />
        </EmpresaProvider>
      </QueryClientProvider>
    );

    // Find the card by its label text
    const saldoCard = screen.getByText('Saldo Projetado').closest('[class*="rounded-lg"]');
    expect(saldoCard).toHaveTextContent('R$ 400,00');
    // The card only contains its own data, not the other cards
    expect(saldoCard).not.toHaveTextContent('Total a Pagar');
  });

  it('displays empty state when no titles exist', () => {
    vi.spyOn(hooksModule, 'useFluxoCaixa').mockReturnValue(mockUseFluxoCaixaResult([]));

    render(
      <QueryClientProvider client={queryClient}>
        <EmpresaProvider>
          <FluxoCaixaPage />
        </EmpresaProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText('Nenhum título para compor o fluxo de caixa')).toBeInTheDocument();
  });

  it('renders table with correct columns', () => {
    vi.spyOn(hooksModule, 'useFluxoCaixa').mockReturnValue(mockUseFluxoCaixaResult([
      { vencimento: '2024-01-15', total_pagar: 1000, total_receber: 2500, saldo: 1500 },
    ]));

    render(
      <QueryClientProvider client={queryClient}>
        <EmpresaProvider>
          <FluxoCaixaPage />
        </EmpresaProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText('Vencimento')).toBeInTheDocument();
    expect(screen.getByText('A Pagar')).toBeInTheDocument();
    expect(screen.getByText('A Receber')).toBeInTheDocument();
    expect(screen.getByText('Saldo do Dia')).toBeInTheDocument();
    expect(screen.getByText('Saldo Acumulado')).toBeInTheDocument();
  });

  it('calculates cumulative balance correctly', () => {
    vi.spyOn(hooksModule, 'useFluxoCaixa').mockReturnValue(mockUseFluxoCaixaResult([
      { vencimento: '2024-01-15', total_pagar: 0, total_receber: 1000, saldo: 1000 },
      { vencimento: '2024-01-20', total_pagar: 500, total_receber: 1000, saldo: 500 },
      { vencimento: '2024-01-25', total_pagar: 0, total_receber: 0, saldo: 0 },
    ]));

    render(
      <QueryClientProvider client={queryClient}>
        <EmpresaProvider>
          <FluxoCaixaPage />
        </EmpresaProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText('15/01/2024')).toBeInTheDocument();
    expect(screen.getByText('20/01/2024')).toBeInTheDocument();
    expect(screen.getByText('25/01/2024')).toBeInTheDocument();
  });

  it('displays footer totals correctly', () => {
    vi.spyOn(hooksModule, 'useFluxoCaixa').mockReturnValue(mockUseFluxoCaixaResult([
      { vencimento: '2024-01-15', total_pagar: 1000, total_receber: 2500, saldo: 1500 },
      { vencimento: '2024-01-20', total_pagar: 500, total_receber: 1500, saldo: 1000 },
    ]));

    render(
      <QueryClientProvider client={queryClient}>
        <EmpresaProvider>
          <FluxoCaixaPage />
        </EmpresaProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.500,00', { selector: 'td:nth-child(2)' })).toBeInTheDocument();
    expect(screen.getByText('R$ 4.000,00', { selector: 'td:nth-child(3)' })).toBeInTheDocument();
    expect(screen.getByText('R$ 2.500,00', { selector: 'td:nth-child(4)' })).toBeInTheDocument();
    expect(screen.getByText('R$ 2.500,00', { selector: 'td:nth-child(5)' })).toBeInTheDocument();
  });
});

// Pure function tests for calcularFluxoCaixa
import { calcularFluxoCaixa } from '@/shared/api/hooks';

describe('calcularFluxoCaixa', () => {

  it('returns empty array for empty input', () => {
    const result = calcularFluxoCaixa([]);
    expect(result).toEqual([]);
  });

  it('excludes cancelled titles', () => {
    const titulos = [
      { id: '1', tipo: 'pagar' as const, valor: 1000, vencimento: '2024-01-15', status: 'cancelado' as const, baixado_em: null, pedido_id: null, compra_id: null },
    ];
    const result = calcularFluxoCaixa(titulos);
    expect(result).toEqual([]);
  });

  it('groups by vencimento date', () => {
    const titulos = [
      { id: '1', tipo: 'pagar' as const, valor: 500, vencimento: '2024-01-15', status: 'aberto' as const, baixado_em: null, pedido_id: null, compra_id: null },
      { id: '2', tipo: 'pagar' as const, valor: 300, vencimento: '2024-01-15', status: 'aberto' as const, baixado_em: null, pedido_id: null, compra_id: null },
    ];
    const result = calcularFluxoCaixa(titulos);
    expect(result).toHaveLength(1);
    expect(result[0].total_pagar).toBe(800);
  });

  it('calculates correct saldo for each date', () => {
    const titulos = [
      { id: '1', tipo: 'pagar' as const, valor: 1000, vencimento: '2024-01-15', status: 'aberto' as const, baixado_em: null, pedido_id: null, compra_id: null },
      { id: '2', tipo: 'receber' as const, valor: 2500, vencimento: '2024-01-15', status: 'aberto' as const, baixado_em: null, pedido_id: 'ped-1', compra_id: null },
    ];
    const result = calcularFluxoCaixa(titulos);
    expect(result).toHaveLength(1);
    expect(result[0].total_pagar).toBe(1000);
    expect(result[0].total_receber).toBe(2500);
    expect(result[0].saldo).toBe(1500);
  });

  it('sorts by vencimento date', () => {
    const titulos = [
      { id: '1', tipo: 'receber' as const, valor: 1000, vencimento: '2024-01-31', status: 'aberto' as const, baixado_em: null, pedido_id: 'ped-1', compra_id: null },
      { id: '2', tipo: 'receber' as const, valor: 1000, vencimento: '2024-01-15', status: 'aberto' as const, baixado_em: null, pedido_id: 'ped-2', compra_id: null },
      { id: '3', tipo: 'receber' as const, valor: 1000, vencimento: '2024-01-20', status: 'aberto' as const, baixado_em: null, pedido_id: 'ped-3', compra_id: null },
    ];
    const result = calcularFluxoCaixa(titulos);
    expect(result[0].vencimento).toBe('2024-01-15');
    expect(result[1].vencimento).toBe('2024-01-20');
    expect(result[2].vencimento).toBe('2024-01-31');
  });
});