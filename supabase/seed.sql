-- Dados fictícios. Os UUIDs de usuário devem ser substituídos por usuários reais no ambiente local.
insert into public.empresas (empresa_id,nome) values
 ('10000000-0000-0000-0000-000000000001','Comércio Aurora Fictício'),
 ('10000000-0000-0000-0000-000000000002','Comércio Horizonte Fictício');
insert into public.perfis (empresa_id,usuario_id,papel) values
 ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','administrador'),
 ('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','administrador');
insert into public.produtos (empresa_id,id,nome,estoque_minimo) values
 ('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Produto fictício A',2),
 ('10000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','Produto fictício B',1);
