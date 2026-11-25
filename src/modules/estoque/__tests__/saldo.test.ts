import { describe, it, expect } from 'vitest';
import { calcularSaldos } from '../saldo';

const produtos = [
  { id: 'p1', nome: 'Parafuso', estoque_minimo: 10 },
  { id: 'p2', nome: 'Porca', estoque_minimo: 5 },
  { id: 'p3', nome: 'Arruela', estoque_minimo: 0 },
];

describe('calcularSaldos', () => {
  it('soma entradas e saídas por produto', () => {
    const r = calcularSaldos(produtos, [
      { produto_id: 'p1', quantidade: 20 },
      { produto_id: 'p1', quantidade: -4 },
      { produto_id: 'p2', quantidade: 5 },
    ]);
    expect(r.find((s) => s.produto_id === 'p1')?.saldo).toBe(16);
    expect(r.find((s) => s.produto_id === 'p2')?.saldo).toBe(5);
  });

  it('alerta só quando saldo < mínimo (igual ao mínimo não alerta)', () => {
    const r = calcularSaldos(produtos, [
      { produto_id: 'p1', quantidade: 9 },
      { produto_id: 'p2', quantidade: 5 },
    ]);
    expect(r.find((s) => s.produto_id === 'p1')?.abaixo_do_minimo).toBe(true);
    expect(r.find((s) => s.produto_id === 'p2')?.abaixo_do_minimo).toBe(false);
  });

  it('produto sem movimento tem saldo 0', () => {
    const r = calcularSaldos(produtos, []);
    expect(r.find((s) => s.produto_id === 'p3')).toMatchObject({ saldo: 0, abaixo_do_minimo: false });
    expect(r.find((s) => s.produto_id === 'p1')?.abaixo_do_minimo).toBe(true);
  });
});
