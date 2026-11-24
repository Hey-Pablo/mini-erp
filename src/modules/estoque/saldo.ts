import type { MovimentoEstoque, ProdutoEstoque, SaldoProduto } from '../../shared/types';

// Saldo = soma das quantidades dos movimentos; alerta quando saldo < estoque_minimo.
export function calcularSaldos(
  produtos: ProdutoEstoque[],
  movimentos: Pick<MovimentoEstoque, 'produto_id' | 'quantidade'>[]
): SaldoProduto[] {
  const soma = new Map<string, number>();
  for (const m of movimentos) {
    soma.set(m.produto_id, (soma.get(m.produto_id) ?? 0) + Number(m.quantidade));
  }
  return produtos.map((p) => {
    const saldo = soma.get(p.id) ?? 0;
    return {
      produto_id: p.id,
      nome: p.nome,
      saldo,
      estoque_minimo: Number(p.estoque_minimo),
      abaixo_do_minimo: saldo < Number(p.estoque_minimo),
    };
  });
}
