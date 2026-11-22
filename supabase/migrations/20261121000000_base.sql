-- A empresa é a fronteira de autorização e também integra as chaves estrangeiras.
create table public.empresas (empresa_id uuid primary key default gen_random_uuid(), nome text not null);
create table public.perfis (empresa_id uuid not null references public.empresas, usuario_id uuid not null, papel text not null check (papel in ('administrador','vendas','estoque','financeiro')), primary key (empresa_id, usuario_id));
create table public.produtos (empresa_id uuid not null references public.empresas, id uuid not null default gen_random_uuid(), nome text not null, estoque_minimo numeric(14,3) not null default 0 check (estoque_minimo >= 0), primary key (empresa_id,id));
create table public.pedidos (empresa_id uuid not null references public.empresas, id uuid not null default gen_random_uuid(), cliente text not null, status text not null default 'aberto' check (status in ('aberto','faturado','cancelado')), vencimento date not null, primary key (empresa_id,id));
create table public.itens_pedido (empresa_id uuid not null, pedido_id uuid not null, produto_id uuid not null, quantidade numeric(14,3) not null check (quantidade > 0), preco numeric(14,2) not null check (preco > 0), primary key (empresa_id,pedido_id,produto_id), foreign key (empresa_id,pedido_id) references public.pedidos, foreign key (empresa_id,produto_id) references public.produtos);
create table public.compras (empresa_id uuid not null references public.empresas, id uuid not null default gen_random_uuid(), fornecedor text not null, vencimento date not null, status text not null default 'aberta' check (status in ('aberta','recebida')), primary key (empresa_id,id));
create table public.itens_compra (empresa_id uuid not null, compra_id uuid not null, produto_id uuid not null, quantidade numeric(14,3) not null check (quantidade > 0), preco numeric(14,2) not null check (preco > 0), primary key (empresa_id,compra_id,produto_id), foreign key (empresa_id,compra_id) references public.compras, foreign key (empresa_id,produto_id) references public.produtos);
create table public.movimentos_estoque (empresa_id uuid not null, id uuid not null default gen_random_uuid(), produto_id uuid not null, quantidade numeric(14,3) not null check (quantidade <> 0), pedido_id uuid, compra_id uuid, criado_em timestamptz not null default now(), primary key (empresa_id,id), foreign key (empresa_id,produto_id) references public.produtos, foreign key (empresa_id,pedido_id) references public.pedidos, foreign key (empresa_id,compra_id) references public.compras);
create table public.titulos (empresa_id uuid not null references public.empresas, id uuid not null default gen_random_uuid(), tipo text not null check (tipo in ('pagar','receber')), valor numeric(14,2) not null check (valor > 0), vencimento date not null, status text not null default 'aberto' check (status in ('aberto','baixado','cancelado')), baixado_em timestamptz, pedido_id uuid, compra_id uuid, primary key (empresa_id,id), foreign key (empresa_id,pedido_id) references public.pedidos, foreign key (empresa_id,compra_id) references public.compras);

-- Função proprietária só consulta o vínculo do usuário autenticado; não aceita usuário externo.
create function public.tem_papel(p_empresa uuid, p_papeis text[]) returns boolean language sql stable security definer set search_path = '' as $$
 select exists (select 1 from public.perfis where empresa_id = p_empresa and usuario_id = auth.uid() and papel = any(p_papeis))
$$;
revoke all on function public.tem_papel(uuid,text[]) from public;
grant execute on function public.tem_papel(uuid,text[]) to authenticated;

do $$ declare t text; begin
 foreach t in array array['empresas','perfis','produtos','pedidos','itens_pedido','compras','itens_compra','movimentos_estoque','titulos'] loop
  execute format('alter table public.%I enable row level security',t);
 end loop;
end $$;
create policy empresa_leitura on public.empresas for select to authenticated using (public.tem_papel(empresa_id,array['administrador','vendas','estoque','financeiro']));
create policy perfil_leitura on public.perfis for select to authenticated using (usuario_id = auth.uid() or public.tem_papel(empresa_id,array['administrador']));
create policy perfil_admin on public.perfis for all to authenticated using (public.tem_papel(empresa_id,array['administrador'])) with check (public.tem_papel(empresa_id,array['administrador']));
create policy produto_leitura on public.produtos for select to authenticated using (public.tem_papel(empresa_id,array['administrador','vendas','estoque']));
create policy produto_escrita on public.produtos for all to authenticated using (public.tem_papel(empresa_id,array['administrador','estoque'])) with check (public.tem_papel(empresa_id,array['administrador','estoque']));
create policy pedido_leitura on public.pedidos for select to authenticated using (public.tem_papel(empresa_id,array['administrador','vendas']));
create policy pedido_inserir on public.pedidos for insert to authenticated with check (status = 'aberto' and public.tem_papel(empresa_id,array['administrador','vendas']));
create policy item_pedido_leitura on public.itens_pedido for select to authenticated using (public.tem_papel(empresa_id,array['administrador','vendas']));
create policy item_pedido_inserir on public.itens_pedido for insert to authenticated with check (public.tem_papel(empresa_id,array['administrador','vendas']) and exists (select 1 from public.pedidos p where p.empresa_id = itens_pedido.empresa_id and p.id = itens_pedido.pedido_id and p.status = 'aberto'));
create policy compra_leitura on public.compras for select to authenticated using (public.tem_papel(empresa_id,array['administrador','estoque']));
create policy compra_inserir on public.compras for insert to authenticated with check (status = 'aberta' and public.tem_papel(empresa_id,array['administrador','estoque']));
create policy item_compra_leitura on public.itens_compra for select to authenticated using (public.tem_papel(empresa_id,array['administrador','estoque']));
create policy item_compra_inserir on public.itens_compra for insert to authenticated with check (public.tem_papel(empresa_id,array['administrador','estoque']) and exists (select 1 from public.compras c where c.empresa_id = itens_compra.empresa_id and c.id = itens_compra.compra_id and c.status = 'aberta'));
create policy movimento_leitura on public.movimentos_estoque for select to authenticated using (public.tem_papel(empresa_id,array['administrador','estoque','vendas']));
create policy titulo_leitura on public.titulos for select to authenticated using (public.tem_papel(empresa_id,array['administrador','financeiro']));
grant select on public.empresas,public.perfis,public.produtos,public.pedidos,public.itens_pedido,public.compras,public.itens_compra,public.movimentos_estoque,public.titulos to authenticated;
grant insert,update,delete on public.perfis,public.produtos to authenticated;
grant insert on public.pedidos,public.itens_pedido,public.compras,public.itens_compra to authenticated;
create view public.saldo_estoque with (security_invoker=true) as select p.empresa_id,p.id as produto_id,p.nome,p.estoque_minimo,coalesce(sum(m.quantidade),0) as saldo,coalesce(sum(m.quantidade),0) <= p.estoque_minimo as estoque_baixo from public.produtos p left join public.movimentos_estoque m on m.empresa_id=p.empresa_id and m.produto_id=p.id group by p.empresa_id,p.id,p.nome,p.estoque_minimo;
grant select on public.saldo_estoque to authenticated;

create function public.faturar_pedido(p_empresa uuid,p_pedido uuid) returns void language plpgsql security definer set search_path = '' as $$
declare p public.pedidos; i record; saldo numeric; total numeric;
begin
 if not public.tem_papel(p_empresa,array['administrador','vendas']) then raise exception 'Acesso negado'; end if;
 select * into p from public.pedidos where empresa_id=p_empresa and id=p_pedido for update;
 if not found or p.status <> 'aberto' then raise exception 'Pedido não está aberto'; end if;
 if not exists(select 1 from public.itens_pedido where empresa_id=p_empresa and pedido_id=p_pedido) then raise exception 'Pedido sem itens'; end if;
 -- Bloqueia produtos em ordem estável para serializar vendas e entradas concorrentes.
 for i in select * from public.itens_pedido where empresa_id=p_empresa and pedido_id=p_pedido order by produto_id loop
  perform 1 from public.produtos where empresa_id=p_empresa and id=i.produto_id for update;
  select coalesce(sum(quantidade),0) into saldo from public.movimentos_estoque where empresa_id=p_empresa and produto_id=i.produto_id;
  if saldo < i.quantidade then raise exception 'Estoque insuficiente'; end if;
 end loop;
 insert into public.movimentos_estoque(empresa_id,produto_id,quantidade,pedido_id) select empresa_id,produto_id,-quantidade,pedido_id from public.itens_pedido where empresa_id=p_empresa and pedido_id=p_pedido;
 select sum(quantidade*preco) into total from public.itens_pedido where empresa_id=p_empresa and pedido_id=p_pedido;
 insert into public.titulos(empresa_id,tipo,valor,vencimento,pedido_id) values(p_empresa,'receber',total,p.vencimento,p_pedido);
 update public.pedidos set status='faturado' where empresa_id=p_empresa and id=p_pedido;
end $$;
create function public.cancelar_pedido(p_empresa uuid,p_pedido uuid) returns void language plpgsql security definer set search_path = '' as $$
declare p public.pedidos; i record;
begin
 if not public.tem_papel(p_empresa,array['administrador','vendas']) then raise exception 'Acesso negado'; end if;
 select * into p from public.pedidos where empresa_id=p_empresa and id=p_pedido for update;
 if not found or p.status <> 'faturado' then raise exception 'Pedido não está faturado'; end if;
 perform 1 from public.titulos where empresa_id=p_empresa and pedido_id=p_pedido for update;
 if exists(select 1 from public.titulos where empresa_id=p_empresa and pedido_id=p_pedido and status='baixado') then raise exception 'Título já baixado'; end if;
 for i in select produto_id from public.itens_pedido where empresa_id=p_empresa and pedido_id=p_pedido order by produto_id loop perform 1 from public.produtos where empresa_id=p_empresa and id=i.produto_id for update; end loop;
 insert into public.movimentos_estoque(empresa_id,produto_id,quantidade,pedido_id) select empresa_id,produto_id,quantidade,pedido_id from public.itens_pedido where empresa_id=p_empresa and pedido_id=p_pedido;
 update public.titulos set status='cancelado' where empresa_id=p_empresa and pedido_id=p_pedido;
 update public.pedidos set status='cancelado' where empresa_id=p_empresa and id=p_pedido;
end $$;
create function public.receber_compra(p_empresa uuid,p_compra uuid) returns void language plpgsql security definer set search_path = '' as $$
declare c public.compras; i record; total numeric;
begin
 if not public.tem_papel(p_empresa,array['administrador','estoque']) then raise exception 'Acesso negado'; end if;
 select * into c from public.compras where empresa_id=p_empresa and id=p_compra for update;
 if not found or c.status <> 'aberta' then raise exception 'Compra não está aberta'; end if;
 if not exists(select 1 from public.itens_compra where empresa_id=p_empresa and compra_id=p_compra) then raise exception 'Compra sem itens'; end if;
 for i in select produto_id from public.itens_compra where empresa_id=p_empresa and compra_id=p_compra order by produto_id loop perform 1 from public.produtos where empresa_id=p_empresa and id=i.produto_id for update; end loop;
 insert into public.movimentos_estoque(empresa_id,produto_id,quantidade,compra_id) select empresa_id,produto_id,quantidade,compra_id from public.itens_compra where empresa_id=p_empresa and compra_id=p_compra;
 select sum(quantidade*preco) into total from public.itens_compra where empresa_id=p_empresa and compra_id=p_compra;
 insert into public.titulos(empresa_id,tipo,valor,vencimento,compra_id) values(p_empresa,'pagar',total,c.vencimento,p_compra);
 update public.compras set status='recebida' where empresa_id=p_empresa and id=p_compra;
end $$;
create function public.baixar_titulo(p_empresa uuid,p_titulo uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.tem_papel(p_empresa,array['administrador','financeiro']) then raise exception 'Acesso negado'; end if;
 update public.titulos set status='baixado',baixado_em=now() where empresa_id=p_empresa and id=p_titulo and status='aberto';
 if not found then raise exception 'Título não está aberto'; end if;
end $$;
revoke all on function public.faturar_pedido(uuid,uuid),public.cancelar_pedido(uuid,uuid),public.receber_compra(uuid,uuid),public.baixar_titulo(uuid,uuid) from public;
grant execute on function public.faturar_pedido(uuid,uuid),public.cancelar_pedido(uuid,uuid),public.receber_compra(uuid,uuid),public.baixar_titulo(uuid,uuid) to authenticated;

-- Serializa inclusão de itens com a transição do documento.
create function public.validar_item_aberto() returns trigger language plpgsql security definer set search_path = '' as $$
declare estado text;
begin
 if tg_table_name = 'itens_pedido' then
  select status into estado from public.pedidos where empresa_id=new.empresa_id and id=new.pedido_id for update;
  if estado is distinct from 'aberto' then raise exception 'Pedido não está aberto'; end if;
 else
  select status into estado from public.compras where empresa_id=new.empresa_id and id=new.compra_id for update;
  if estado is distinct from 'aberta' then raise exception 'Compra não está aberta'; end if;
 end if;
 return new;
end $$;
revoke all on function public.validar_item_aberto() from public;
create trigger item_pedido_aberto before insert on public.itens_pedido for each row execute function public.validar_item_aberto();
create trigger item_compra_aberta before insert on public.itens_compra for each row execute function public.validar_item_aberto();
