import { describe, it, expect } from 'vitest';
import { calcularFluxoCaixa } from '@/shared/api/hooks';
import type { Titulo } from '@/shared/types';

describe('calcularFluxoCaixa', () => {
  it('returns empty array for empty input', () => {
    const result = calcularFluxoCaixa([]);
    expect(result).toEqual([]);
  });

  it('excludes cancelled titles', () => {
    const titulos: Titulo[] = [
      {
        id: '1',
        tipo: 'pagar',
        valor: 1000,
        vencimento: '2024-01-15',
        status: 'cancelado',
        baixado_em: null,
        pedido_id: null,
        compra_id: null,
      },
    ];
    const result = calcularFluxoCaixa(titulos);
    expect(result).toEqual([]);
  });

  it('groups by vencimento date and sums values', () => {
    const titulos: Titulo[] = [
      {
        id: '1',
        tipo: 'pagar',
        valor: 500,
        vencimento: '2024-01-15',
        status: 'aberto',
        baixado_em: null,
        pedido_id: null,
        compra_id: null,
      },
      {
        id: '2',
        tipo: 'pagar',
        valor: 300,
        vencimento: '2024-01-15',
        status: 'aberto',
        baixado_em: null,
        pedido_id: null,
        compra_id: null,
      },
    ];
    const result = calcularFluxoCaixa(titulos);
    expect(result).toHaveLength(1);
    expect(result[0].total_pagar).toBe(800);
    expect(result[0].total_receber).toBe(0);
  });

  it('distinguishes pagar from receber', () => {
    const titulos: Titulo[] = [
      {
        id: '1',
        tipo: 'pagar',
        valor: 1000,
        vencimento: '2024-01-15',
        status: 'aberto',
        baixado_em: null,
        pedido_id: null,
        compra_id: null,
      },
      {
        id: '2',
        tipo: 'receber',
        valor: 2500,
        vencimento: '2024-01-15',
        status: 'aberto',
        baixado_em: null,
        pedido_id: 'ped-1',
        compra_id: null,
      },
    ];
    const result = calcularFluxoCaixa(titulos);
    expect(result).toHaveLength(1);
    expect(result[0].total_pagar).toBe(1000);
    expect(result[0].total_receber).toBe(2500);
  });

  it('calculates correct saldo for each date', () => {
    const titulos: Titulo[] = [
      {
        id: '1',
        tipo: 'pagar',
        valor: 1000,
        vencimento: '2024-01-15',
        status: 'aberto',
        baixado_em: null,
        pedido_id: null,
        compra_id: null,
      },
      {
        id: '2',
        tipo: 'receber',
        valor: 2500,
        vencimento: '2024-01-15',
        status: 'aberto',
        baixado_em: null,
        pedido_id: 'ped-1',
        compra_id: null,
      },
    ];
    const result = calcularFluxoCaixa(titulos);
    expect(result[0].saldo).toBe(1500); // 2500 - 1000
  });

  it('sorts by vencimento date (ascending)', () => {
    const titulos: Titulo[] = [
      {
        id: '1',
        tipo: 'receber',
        valor: 1000,
        vencimento: '2024-01-31',
        status: 'aberto',
        baixado_em: null,
        pedido_id: 'ped-1',
        compra_id: null,
      },
      {
        id: '2',
        tipo: 'receber',
        valor: 1000,
        vencimento: '2024-01-15',
        status: 'aberto',
        baixado_em: null,
        pedido_id: 'ped-2',
        compra_id: null,
      },
      {
        id: '3',
        tipo: 'receber',
        valor: 1000,
        vencimento: '2024-01-20',
        status: 'aberto',
        baixado_em: null,
        pedido_id: 'ped-3',
        compra_id: null,
      },
    ];
    const result = calcularFluxoCaixa(titulos);
    expect(result[0].vencimento).toBe('2024-01-15');
    expect(result[1].vencimento).toBe('2024-01-20');
    expect(result[2].vencimento).toBe('2024-01-31');
  });

  it('handles single title correctly', () => {
    const titulos: Titulo[] = [
      {
        id: '1',
        tipo: 'pagar',
        valor: 1500.5,
        vencimento: '2024-01-15',
        status: 'aberto',
        baixado_em: null,
        pedido_id: null,
        compra_id: 'comp-1',
      },
    ];
    const result = calcularFluxoCaixa(titulos);
    expect(result).toHaveLength(1);
    expect(result[0].total_pagar).toBe(1500.5);
    expect(result[0].total_receber).toBe(0);
    expect(result[0].saldo).toBe(-1500.5);
  });

  it('handles mixed status titles', () => {
    const titulos: Titulo[] = [
      {
        id: '1',
        tipo: 'pagar',
        valor: 1000,
        vencimento: '2024-01-15',
        status: 'aberto',
        baixado_em: null,
        pedido_id: null,
        compra_id: null,
      },
      {
        id: '2',
        tipo: 'pagar',
        valor: 500,
        vencimento: '2024-01-15',
        status: 'baixado',
        baixado_em: '2024-01-10T00:00:00Z',
        pedido_id: null,
        compra_id: 'comp-1',
      },
      {
        id: '3',
        tipo: 'pagar',
        valor: 800,
        vencimento: '2024-01-15',
        status: 'cancelado',
        baixado_em: null,
        pedido_id: null,
        compra_id: null,
      },
    ];
    const result = calcularFluxoCaixa(titulos);
    expect(result).toHaveLength(1);
    // Only 'cancelado' is excluded, both 'aberto' and 'baixado' are included
    expect(result[0].total_pagar).toBe(1500); // 1000 + 500
    expect(result[0].saldo).toBe(-1500);
  });

  it('returns correct saldo values with precision', () => {
    const titulos: Titulo[] = [
      {
        id: '1',
        tipo: 'receber',
        valor: 1234.56,
        vencimento: '2024-01-15',
        status: 'aberto',
        baixado_em: null,
        pedido_id: 'ped-1',
        compra_id: null,
      },
      {
        id: '2',
        tipo: 'pagar',
        valor: 789.12,
        vencimento: '2024-01-15',
        status: 'aberto',
        baixado_em: null,
        pedido_id: null,
        compra_id: null,
      },
    ];
    const result = calcularFluxoCaixa(titulos);
    expect(result[0].total_receber).toBe(1234.56);
    expect(result[0].total_pagar).toBe(789.12);
    expect(result[0].saldo).toBeCloseTo(445.44, 2); // 1234.56 - 789.12
  });

  it('handles titles without pedido_id or compra_id', () => {
    const titulos: Titulo[] = [
      {
        id: '1',
        tipo: 'receber',
        valor: 1000,
        vencimento: '2024-01-15',
        status: 'aberto',
        baixado_em: null,
        pedido_id: null,
        compra_id: null,
      },
    ];
    const result = calcularFluxoCaixa(titulos);
    expect(result).toHaveLength(1);
    expect(result[0].vencimento).toBe('2024-01-15');
  });
});