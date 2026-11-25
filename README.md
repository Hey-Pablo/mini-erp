# Mini ERP - Sistema Multiempresa

> **Demonstração:** em breve

Sistema de gestão empresarial para pequeno comércio, com suporte a múltiplas empresas isoladas no mesmo banco de dados. Inclui cadastros, vendas, compras, estoque, financeiro e relatórios.

## Stack

React 18, TypeScript, Vite 5, Tailwind CSS, TanStack Query, React Hook Form + Zod, React Router DOM 6, Sonner (notificações), Lucide React (ícones). Authentication via Supabase client com RLS. Testes com Vitest + Testing Library.

## Funcionalidades Implementadas (Etapa 2)

### Autenticação
- Login via cliente Supabase com sessão persistente
- Contexto de autenticação compartilhado globalmente
- Mock para desenvolvimento sem Supabase real

### Layout
- Sidebar responsiva com navegação por papel
- Guardas de rota (`RequireAuth`, `RequireRole`)
- Papéis: administrador, vendas, estoque, financeiro

### Cadastros

#### Clientes
- Listagem com busca e paginação
- Validação de documento (CPF/CNPJ)
- Formatação automática de CPF/CNPJ

#### Fornecedores
- Listagem com busca e paginação
- Validação de documento (CPF/CNPJ)

#### Produtos
- Listagem com busca e paginação
- Controle de estoque mínimo
- Preços de custo e venda

### Validações
- CPF: 7 testes unitários
- CNPJ: 8 testes unitários

## Documento interno do pedido

A função `gerarDocumentoPedido(pedido, itens)` em `src/modules/vendas/documentoPedido.ts` gera bytes PDF com os itens, o total e o aviso de ausência de valor fiscal. Os campos correspondem ao esquema de pedidos e itens; o identificador do produto é exibido no documento. Não há emissão de NF-e.

### Download de PDF

Na tela de pedidos (PedidosPage), o botão "Baixar PDF" está disponível para pedidos com status **faturado**. Ao clicar, o sistema:

1. Monta o documento a partir do pedido (id, cliente, vencimento) e itens (produto_id, quantidade, preço)
2. Gera os bytes PDF via `gerarDocumentoPedido`
3. Cria um Blob e dispara o download com nome `pedido-<id>.pdf`
4. Revoke o URL temporário após o download

## Estrutura

```
mini-erp/
├─ src/
│  ├─ app/                 # rotas, layout, guardas por papel
│  ├─ modules/
│  │  ├─ auth/             # página de login
│  │  ├─ cadastros/
│  │  │  ├─ clientes/      # página de clientes
│  │  │  ├─ fornecedores/  # página de fornecedores
│  │  │  └─ produtos/      # página de produtos
│  │  └─ pages/            # outras páginas
│  └─ shared/
│     ├─ api/              # cliente Supabase e hooks
│     ├─ auth/             # providers de autenticação
│     ├─ context/          # provider de empresa e papéis
│     ├─ ui/               # componentes de UI
│     ├─ lib/              # utilitários
│     └─ validators/       # validações CPF/CNPJ
├─ vite.config.ts
├─ tailwind.config.js
├─ tsconfig.json
├─ vite.config.ts
├─ vitest.config.ts
└─ package.json
```

## Configurar o banco

Antes de usar o sistema, é necessário configurar o banco de dados. Siga os passos abaixo:

### 1. Criar projeto no Supabase (ou usar PostgreSQL próprio)

- Acesse https://supabase.com e crie um novo projeto
- Copie a URL do projeto (ex: `https://xyz.supabase.co`) e a chave anon (em Settings > API > Project Settings > API Keys)

### 2. Aplicar migrations

```bash
npm install -g supabase
supabase db push
# ou, se usando PostgreSQL local:
# psql -h localhost -U postgres -d minierp -f supabase/migrations/20261121000000_base.sql
```

### 3. Executar seed.sql

```bash
psql -h localhost -U postgres -d minierp -f supabase/seed.sql
# ou, se usando Supabase CLI:
# supabase db remote
```

### 4. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Editar .env com os valores reais:
# VITE_SUPABASE_URL=https://seu-projeto.supabase.co
# VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 5. Criar usuários e definir papéis

No painel do Supabase, vá para SQL e execute:

```sql
-- Criar usuário (se não usar auth.usuarios)
INSERT INTO perfis (empresa_id, usuario_id, papel) VALUES
  ('10000000-0000-0000-0000-000000000001', '<uuid-do-usuario>', 'administrador');
```

O `usuario_id` é o UUID do usuário no Supabase Auth (acessível via `supabase.auth.getUser()` após login).

### 6. Rodar a aplicação

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173` e faça login com as credenciais do usuário criado.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Testes

```bash
npm test
```

Os testes incluem:
- Testes de validação CPF/CNPJ
- Testes de unidade do banco com PGlite
- Testes de integração com Testing Library

## Próximos passos

1. Conectar com Supabase real (variáveis de ambiente)
2. Implementar seed de dados nas tabelas
3. Testes de integração com MSW
4. Módulos de vendas, estoque e financeiro

## Licença

MIT