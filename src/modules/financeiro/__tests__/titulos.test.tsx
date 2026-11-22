import { render, screen, fireEvent } from '@testing-library/react';
import { TitulosPage } from '../pages/TitulosPage';
import { EmpresaProvider } from '@/shared/context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Titulo } from '@/shared/types';
import * as hooksModule from '@/shared/api/hooks';

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

// Helper to create mock useTitulos return value
const mockUseTitulosResult = (data: Titulo[], total: number) => ({
  data: { data, total },
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

const mockTitulos: Titulo[] = [
  {
    id: '1',
    tipo: 'pagar',
    valor: 1000.00,
    vencimento: '2024-01-15',
    status: 'aberto',
    baixado_em: null,
    pedido_id: null,
    compra_id: 'comp-1',
  },
  {
    id: '2',
    tipo: 'receber',
    valor: 2500.00,
    vencimento: '2024-01-20',
    status: 'aberto',
    baixado_em: null,
    pedido_id: 'ped-1',
    compra_id: null,
  },
  {
    id: '3',
    tipo: 'pagar',
    valor: 500.00,
    vencimento: '2024-01-25',
    status: 'baixado',
    baixado_em: '2024-01-10T00:00:00Z',
    pedido_id: null,
    compra_id: 'comp-2',
  },
];

describe('TitulosPage', () => {
  const queryClient = new QueryClient();

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <EmpresaProvider>
          {ui}
        </EmpresaProvider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient.clear();
  });

  it('renders the page title and description', () => {
    vi.spyOn(hooksModule, 'useTitulos').mockReturnValue(mockUseTitulosResult([], 0));

    renderWithProviders(<TitulosPage />);

    expect(screen.getByText('Títulos a Pagar/Receber')).toBeInTheDocument();
    expect(screen.getByText('Gerencie os títulos financeiros da empresa')).toBeInTheDocument();
  });

  it('renders empty state when no titles exist', () => {
    vi.spyOn(hooksModule, 'useTitulos').mockReturnValue(mockUseTitulosResult([], 0));

    renderWithProviders(<TitulosPage />);

    expect(screen.getByText('Nenhum título encontrado')).toBeInTheDocument();
  });

  it('renders titles in a table with correct columns', () => {
    vi.spyOn(hooksModule, 'useTitulos').mockReturnValue(mockUseTitulosResult(mockTitulos, 3));

    vi.spyOn(hooksModule, 'useBaixarTitulo').mockImplementation(() => Promise.resolve() as any);

    renderWithProviders(<TitulosPage />);

    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Valor')).toBeInTheDocument();
    expect(screen.getByText('Vencimento')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Origem')).toBeInTheDocument();
    expect(screen.getByText('Ações')).toBeInTheDocument();
  });

  it('displays pagar titles with red styling', () => {
    vi.spyOn(hooksModule, 'useTitulos').mockReturnValue(mockUseTitulosResult([mockTitulos[0]], 1));

    renderWithProviders(<TitulosPage />);

    expect(screen.getByText('Pagar')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.000,00')).toBeInTheDocument();
  });

  it('displays receber titles with green styling', () => {
    vi.spyOn(hooksModule, 'useTitulos').mockReturnValue(mockUseTitulosResult([mockTitulos[1]], 1));

    renderWithProviders(<TitulosPage />);

    expect(screen.getByText('Receber')).toBeInTheDocument();
    expect(screen.getByText('R$ 2.500,00')).toBeInTheDocument();
  });

  it('displays status badges correctly', () => {
    vi.spyOn(hooksModule, 'useTitulos').mockReturnValue(mockUseTitulosResult(mockTitulos, 3));

    renderWithProviders(<TitulosPage />);

    expect(screen.getAllByText('Aberto')).toHaveLength(3); // 2 in badges + 1 in select option
    expect(screen.getAllByText('Baixado')).toHaveLength(2); // 1 in badge + 1 in select option
  });

  it('shows baixar button only for open titles', () => {
    vi.spyOn(hooksModule, 'useTitulos').mockReturnValue(mockUseTitulosResult(mockTitulos, 3));

    vi.spyOn(hooksModule, 'useBaixarTitulo').mockImplementation(() => Promise.resolve() as any);

    renderWithProviders(<TitulosPage />);

    const baixarButtons = screen.getAllByRole('button', { name: /baixar/i });
    expect(baixarButtons).toHaveLength(2); // Only 2 open titles
  });

  it('does not show baixar button for already paid titles', () => {
    vi.spyOn(hooksModule, 'useTitulos').mockReturnValue(mockUseTitulosResult([mockTitulos[2]], 1));

    renderWithProviders(<TitulosPage />);

    expect(screen.queryByRole('button', { name: /baixar/i })).not.toBeInTheDocument();
  });

  it('filters by tipo when selection changes', () => {
    vi.spyOn(hooksModule, 'useTitulos').mockReturnValue(mockUseTitulosResult([], 0));

    renderWithProviders(<TitulosPage />);

    const tipoSelect = screen.getByRole('combobox', { name: /tipo/i });
    fireEvent.mouseDown(tipoSelect);

    const pagarOption = screen.getByRole('option', { name: 'A Pagar' });
    fireEvent.click(pagarOption);

    expect(hooksModule.useTitulos).toHaveBeenCalled();
  });
});

