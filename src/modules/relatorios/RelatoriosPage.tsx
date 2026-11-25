import { useEffect, useState } from 'react';
import { useEmpresa } from '../../shared/context';
import { supabase } from '../../shared/api/client';

type Venda = { data: string; total: number };
type Produto = { produto: string; total: number; percentual_acumulado: number; classe: string };
type Atraso = { cliente: string; vencimento: string; valor: number; dias_atraso: number };
const hoje = () => new Date().toISOString().slice(0, 10);
const moeda = (valor: number) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function RelatoriosPage() {
  const { empresa } = useEmpresa();
  const [inicio, setInicio] = useState(() => `${hoje().slice(0, 7)}-01`);
  const [fim, setFim] = useState(hoje);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [atrasos, setAtrasos] = useState<Atraso[]>([]);
  const [erro, setErro] = useState('');
  useEffect(() => {
    if (!empresa?.empresa_id) return;
    let ativo = true;
    const carregar = async () => {
      const args = { p_empresa: empresa.empresa_id, p_inicio: inicio, p_fim: fim };
      const [v, a, i] = await Promise.all([
        supabase.rpc('relatorio_vendas', args), supabase.rpc('relatorio_abc', args),
        supabase.rpc('relatorio_inadimplencia', { p_empresa: empresa.empresa_id, p_data: fim }),
      ]);
      if (!ativo) return;
      if (v.error || a.error || i.error) { setErro('Não foi possível carregar os relatórios. Confira o período e tente novamente.'); return; }
      setErro(''); setVendas(v.data || []); setProdutos(a.data || []); setAtrasos(i.data || []);
    };
    void carregar();
    return () => { ativo = false; };
  }, [empresa?.empresa_id, inicio, fim]);
  return <section className="space-y-6">
    <h1 className="text-xl font-bold">Relatórios</h1>
    <div className="flex gap-4"><label>Início <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} /></label><label>Fim <input type="date" value={fim} onChange={e => setFim(e.target.value)} /></label></div>
    {erro && <p role="alert">{erro}</p>}
    <section><h2>Vendas por período</h2>{vendas.length ? vendas.map(v => <p key={v.data}>{v.data}: {moeda(v.total)}</p>) : <p>Sem vendas no período.</p>}</section>
    <section><h2>Curva ABC</h2>{produtos.length ? produtos.map(p => <p key={p.produto}>{p.produto}: {moeda(p.total)} — {p.percentual_acumulado}% — {p.classe}</p>) : <p>Sem produtos no período.</p>}</section>
    <section><h2>Inadimplência</h2>{atrasos.length ? atrasos.map((a, n) => <p key={n}>{a.cliente} — {a.vencimento} — {moeda(a.valor)} — {a.dias_atraso} dias</p>) : <p>Sem títulos vencidos.</p>}</section>
  </section>;
}
