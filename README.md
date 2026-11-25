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

O repositório não inclui um banco hospedado nem credenciais reais. Para conectar sua própria instância Supabase:

1. Crie um projeto Supabase sob sua responsabilidade.
2. Instale a CLI Supabase e conecte o diretório ao projeto escolhido.
3. Aplique as migrações com `supabase db push`.
4. Execute `supabase/seed.sql` no editor SQL do projeto para carregar dados fictícios.
5. Crie usuários no Supabase Auth e associe os IDs aos papéis na tabela `perfis`, para a empresa desejada.
6. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os dados públicos do seu projeto. Nunca use a chave de serviço no navegador.
7. Rode `npm ci` e `npm run dev`; entre com um usuário criado no passo 5.

Sem as duas variáveis, a aplicação exibe uma orientação para configurar o banco. O banco local PGlite usado nos testes não é um servidor Supabase e não fornece autenticação ou API ao navegador.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Testes

```bash
npm run test
```

### Credenciais de teste
- Email: `admin@minierp.com`
- Senha: `senha123`

## Próximos passos

1. Conectar com Supabase real (variáveis de ambiente)
2. Implementar seed de dados nas tabelas
3. Testes de integração com MSW
4. Módulos de vendas, estoque e financeiro

## Licença

MIT