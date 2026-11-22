-- Schema inicial do mini-erp
-- Tabelas multiempresa com empresa_id

-- Extension for UUID generation
create extension if not exists "uuid-ossp";

-- Tabela de empresas
create table empresas (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  cnpj text not null unique,
  inscricao_estadual text,
  endereco jsonb,
  criado_em timestamp with time zone default now()
);

-- Tabela de perfis (usuários com papel)
create table perfis (
  id uuid primary key references auth.users(id),
  empresa_id uuid references empresas(id),
  email text not null,
  role text check (role in ('admin', 'vendas', 'estoque', 'financeiro', 'compras')),
  criado_em timestamp with time zone default now()
);

-- Tabela de clientes
create table clientes (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) not null,
  nome text not null,
  tipo_pessoa text check (tipo_pessoa in ('F', 'J')) not null,
  cpf_cnpj text not null,
  ie text,
  email text,
  telefone text,
  endereco jsonb,
  ativo boolean default true,
  criado_em timestamp with time zone default now(),
  atualizado_em timestamp with time zone default now()
);

-- Tabela de fornecedores
create table fornecedores (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) not null,
  nome text not null,
  tipo_pessoa text check (tipo_pessoa in ('F', 'J')) not null,
  cpf_cnpj text not null,
  ie text,
  email text,
  telefone text,
  endereco jsonb,
  ativo boolean default true,
  criado_em timestamp with time zone default now(),
  atualizado_em timestamp with time zone default now()
);

-- Tabela de produtos
create table produtos (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) not null,
  codigo text unique,
  nome text not null,
  descricao text,
  unidade text not null,
  preco_venda numeric(10, 2) not null,
  preco_custo numeric(10, 2),
  estoque_minimo numeric not null default 0,
  estoque_atual numeric not null default 0,
  ativo boolean default true,
  ncm text,
  criado_em timestamp with time zone default now(),
  atualizado_em timestamp with time zone default now()
);

-- Políticas RLS
alter table empresas enable row level security;
alter table perfis enable row level security;
alter table clientes enable row level security;
alter table fornecedores enable row level security;
alter table produtos enable row level security;

-- Política para perfis
create policy "Perfis do mesmo empresa" on perfis
  for all using (empresa_id = (select empresa_id from perfis where id = auth.uid()));

-- Política para clientes
create policy "Clientes do mesmo empresa" on clientes
  for all using (
    empresa_id = (select empresa_id from perfis where id = auth.uid())
  );

-- Política para fornecedores
create policy "Fornecedores do mesmo empresa" on fornecedores
  for all using (
    empresa_id = (select empresa_id from perfis where id = auth.uid())
  );

-- Política para produtos
create policy "Produtos do mesmo empresa" on produtos
  for all using (
    empresa_id = (select empresa_id from perfis where id = auth.uid())
  );