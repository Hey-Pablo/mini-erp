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

### Compras
- Lista de compras com fornecedores
- Formulário para criação de novas compras com itens
- Botão "Receber" que chama RPC `receber_compra` ao Supabase
- Status de compra (aberta/recebida)

### Estoque
- **Saldo de Estoque**: view que soma quantidades de `movimentos_estoque` por produto
- **Alerta de Mínimo**: destaca produtos com saldo <= estoque_minimo
- **Movimentos de Estoque**: histórico de entradas (compras) e saídas (pedidos)
- Colunas: produto, quantidade (positivo=negra, negativo=vermelho), tipo, origem, data

### Validações
- CPF: 7 testes unitários
- CNPJ: 8 testes unitários

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
│  │  ├─ compras/           # módulo de compras
│  │  │  └─ pages/         # ComprasPage.tsx
│  │  ├─ estoque/           # módulo de estoque
│  │  │  └─ pages/         # EstoquePage.tsx
│  │  └─ pages/
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