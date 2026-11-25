import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComprasPage } from '../pages/ComprasPage';

const receberMutate = vi.fn().mockResolvedValue(undefined);
const criarMutate = vi.fn().mockResolvedValue({ id: 'nova' });

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../../shared/context', () => ({
  useEmpresa: () => ({ empresa: { empresa_id: 'emp-1', nome: 'Empresa Teste' } }),
}));
vi.mock('../../../shared/api/hooks', () => ({
  useCompras: () => ({
    error: null,
    data: [
      { id: 'c1', fornecedor: 'Fornecedor Alfa', vencimento: '2026-02-01', status: 'aberta' },
      { id: 'c2', fornecedor: 'Fornecedor Beta', vencimento: '2026-02-10', status: 'recebida' },
    ],
  }),
  useProdutosEstoque: () => ({ data: [{ id: 'p1', nome: 'Parafuso', estoque_minimo: 10 }] }),
  useCreateCompra: () => ({ mutateAsync: criarMutate, isPending: false }),
  useReceberCompra: () => ({ mutateAsync: receberMutate, isPending: false }),
}));

describe('ComprasPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('botão Receber aparece só em compra aberta e chama receber_compra', async () => {
    render(<ComprasPage />);
    const botoes = screen.getAllByRole('button', { name: 'Receber' });
    expect(botoes).toHaveLength(1);
    fireEvent.click(botoes[0]);
    await waitFor(() => expect(receberMutate).toHaveBeenCalledWith({ empresaId: 'emp-1', compraId: 'c1' }));
  });

  it('não cria compra sem item válido', () => {
    render(<ComprasPage />);
    fireEvent.change(screen.getByLabelText('Fornecedor'), { target: { value: 'Fornecedor Gama' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar compra' }));
    expect(criarMutate).not.toHaveBeenCalled();
  });

  it('cria compra com item preenchido', async () => {
    render(<ComprasPage />);
    fireEvent.change(screen.getByLabelText('Fornecedor'), { target: { value: 'Fornecedor Gama' } });
    fireEvent.change(screen.getByLabelText('Vencimento'), { target: { value: '2026-03-01' } });
    fireEvent.change(screen.getByLabelText('Produto'), { target: { value: 'p1' } });
    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('Preço'), { target: { value: '2.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar compra' }));
    await waitFor(() =>
      expect(criarMutate).toHaveBeenCalledWith({
        empresaId: 'emp-1',
        compra: { fornecedor: 'Fornecedor Gama', vencimento: '2026-03-01' },
        itens: [{ produto_id: 'p1', quantidade: 12, preco: 2.5 }],
      })
    );
  });
});
