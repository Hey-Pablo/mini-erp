import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EstoquePage } from '../pages/EstoquePage';

vi.mock('../../../shared/context', () => ({
  useEmpresa: () => ({ empresa: { empresa_id: 'emp-1', nome: 'Empresa Teste' } }),
}));

vi.mock('../../../shared/api/hooks', () => ({
  useProdutosEstoque: () => ({
    isLoading: false,
    error: null,
    data: [
      { id: 'p1', nome: 'Parafuso', estoque_minimo: 10 },
      { id: 'p2', nome: 'Porca', estoque_minimo: 2 },
    ],
  }),
  useMovimentosEstoque: () => ({
    isLoading: false,
    error: null,
    data: [
      { id: 'm1', produto_id: 'p1', quantidade: 6, pedido_id: null, compra_id: 'c1', criado_em: '2026-01-10T12:00:00Z' },
      { id: 'm2', produto_id: 'p2', quantidade: 8, pedido_id: null, compra_id: 'c1', criado_em: '2026-01-10T12:00:00Z' },
    ],
  }),
}));

describe('EstoquePage', () => {
  it('mostra saldo e alerta para produto abaixo do mínimo', () => {
    render(<EstoquePage />);
    expect(screen.getByRole('alert').textContent).toContain('Parafuso');
    expect(screen.getByRole('alert').textContent).not.toContain('Porca');
    expect(screen.getByText('Abaixo do mínimo')).toBeTruthy();
    expect(screen.getByText('OK')).toBeTruthy();
  });
});
