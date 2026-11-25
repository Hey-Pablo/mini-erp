-- Relatórios consolidados são restritos ao administrador da empresa.
-- A data da venda é a data UTC da saída de estoque do faturamento.
create function public.relatorio_vendas(p_empresa uuid, p_inicio date, p_fim date)
returns table(data date, total numeric) language plpgsql stable security definer set search_path = '' as $$
begin
 if not public.tem_papel(p_empresa,array['administrador']) then raise exception 'Acesso negado'; end if;
 if p_inicio is null or p_fim is null or p_inicio > p_fim then raise exception 'Período inválido'; end if;
 return query
 select (m.criado_em at time zone 'UTC')::date, sum(i.quantidade*i.preco)
 from public.movimentos_estoque m
 join public.pedidos p on p.empresa_id=m.empresa_id and p.id=m.pedido_id and p.status='faturado'
 join public.itens_pedido i on i.empresa_id=m.empresa_id and i.pedido_id=m.pedido_id and i.produto_id=m.produto_id
 where m.empresa_id=p_empresa and m.quantidade<0 and (m.criado_em at time zone 'UTC')::date between p_inicio and p_fim
 group by 1 order by 1;
end $$;

create function public.relatorio_abc(p_empresa uuid, p_inicio date, p_fim date)
returns table(produto text, total numeric, percentual_acumulado numeric, classe text) language plpgsql stable security definer set search_path = '' as $$
begin
 if not public.tem_papel(p_empresa,array['administrador']) then raise exception 'Acesso negado'; end if;
 if p_inicio is null or p_fim is null or p_inicio > p_fim then raise exception 'Período inválido'; end if;
 return query
 with totais as (
  select i.produto_id, pr.nome, sum(i.quantidade*i.preco) valor
  from public.movimentos_estoque m
  join public.pedidos p on p.empresa_id=m.empresa_id and p.id=m.pedido_id and p.status='faturado'
  join public.itens_pedido i on i.empresa_id=m.empresa_id and i.pedido_id=m.pedido_id and i.produto_id=m.produto_id
  join public.produtos pr on pr.empresa_id=i.empresa_id and pr.id=i.produto_id
  where m.empresa_id=p_empresa and m.quantidade<0 and (m.criado_em at time zone 'UTC')::date between p_inicio and p_fim
  group by i.produto_id,pr.nome
 ), acumulados as (
  select *, sum(valor) over (order by valor desc, produto_id) acumulado, sum(valor) over () geral from totais
 )
 select nome, valor, round(100*acumulado/geral,2),
  case when (acumulado-valor)/geral < 0.8 then 'A' when (acumulado-valor)/geral < 0.95 then 'B' else 'C' end
 from acumulados order by valor desc, produto_id;
end $$;

create function public.relatorio_inadimplencia(p_empresa uuid, p_data date)
returns table(cliente text, vencimento date, valor numeric, dias_atraso integer) language plpgsql stable security definer set search_path = '' as $$
begin
 if not public.tem_papel(p_empresa,array['administrador']) then raise exception 'Acesso negado'; end if;
 if p_data is null then raise exception 'Data inválida'; end if;
 return query select p.cliente,t.vencimento,t.valor,p_data-t.vencimento
 from public.titulos t join public.pedidos p on p.empresa_id=t.empresa_id and p.id=t.pedido_id
 where t.empresa_id=p_empresa and t.tipo='receber' and t.status='aberto' and t.vencimento<p_data
 order by t.vencimento,p.cliente;
end $$;
revoke all on function public.relatorio_vendas(uuid,date,date), public.relatorio_abc(uuid,date,date), public.relatorio_inadimplencia(uuid,date) from public;
grant execute on function public.relatorio_vendas(uuid,date,date), public.relatorio_abc(uuid,date,date), public.relatorio_inadimplencia(uuid,date) to authenticated;
