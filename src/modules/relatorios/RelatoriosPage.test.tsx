import { render, screen, waitFor } from '@testing-library/react';
import { vi, test, expect } from 'vitest';
import { RelatoriosPage } from './RelatoriosPage';

vi.mock('../../shared/context', () => ({ useEmpresa: () => ({ empresa: { empresa_id: 'empresa-a' } }) }));
vi.mock('../../shared/api/client', () => ({ supabase: { rpc: vi.fn((nome: string) => Promise.resolve({ data: nome === 'relatorio_vendas' ? [{ data: '2026-01-01', total: 40 }] : [], error: null })) } }));

test('apresenta o total de vendas retornado pelo banco', async () => {
  render(<RelatoriosPage />);
  await waitFor(() => expect(screen.getByText(/40,00/)).toBeInTheDocument());
  expect(screen.getByText('Curva ABC')).toBeInTheDocument();
  expect(screen.getByText('Inadimplência')).toBeInTheDocument();
});
