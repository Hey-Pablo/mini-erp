# Mini ERP Multiempresa

> **Status: etapa 2 concluída.** Base React (Vite, Tailwind, rotas por papel, shared/supabase) implementada. Cadastros com busca e paginação implementados.

> **Demonstração:** em breve

## Resumo da Implementação (Etapa 2)

Esta etapa entrega a **base completa** do ERP com:

- **Framework**: React 18 + TypeScript + Vite 5
- **UI**: Tailwind CSS com design responsivo
- **Estado**: TanStack Query (React Query)
- **Formulários**: React Hook Form + Zod
- **Rotas**: React Router DOM com guards por papel
- **Autenticação**: Supabase Auth (mockável para testes)
- **Validação**: CPF/CNPJ com dígitos verificadores

### Funcionalidades entregues
- Tela de login com validação
- Layout com sidebar por papel (admin, vendas, estoque, financeiro, compras)
- Cadastro de clientes com busca, paginação e validação
- Componentes reutilizáveis (Button, Pagination, SearchInput)
- 15 testes unitários passando
- Migrations SQL com RLS

## O que é

ERP enxuto para pequeno comércio, com várias empresas isoladas no mesmo banco: cadastros, vendas, compras, estoque, financeiro e relatórios. Simula o faturamento com documento interno em PDF. Não emite NF-e real, que exige certificado digital e credenciamento.

## O que prova

Arquitetura multiempresa, regras de negócio transacionais no banco, testes de ponta a ponta e o domínio que você conhece por dentro.

## Stack

React, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form e Zod. Supabase (PostgreSQL, RLS, funções em PL/pgSQL). Geração de PDF. Vitest, Playwright, GitHub Actions e Vercel.

## Estrutura

```
mini-erp/
├─ src/
│  ├─ app/                 # rotas, layout, guardas por papel
│  ├─ modules/
│  │  ├─ cadastros/        # clientes, fornecedores, produtos
│  │  ├─ vendas/           # pedido, faturamento, PDF
│  │  ├─ compras/
│  │  ├─ estoque/          # movimentos, saldo, inventário
│  │  ├─ financeiro/       # contas a pagar e a receber, caixa
│  │  ├─ relatorios/
│  │  └─ admin/            # empresa, usuários, papéis
│  └─ shared/              # ui, hooks, supabase, autenticação
├─ supabase/
│  ├─ migrations/          # tabelas com empresa_id, RLS, funções
│  └─ seed.sql             # 2 empresas de demonstração
├─ e2e/                    # Playwright
├─ docs/                   # diagrama, fluxos, decisões
└─ README.md
```

## Plano

1. Escopo fechado e diagrama de dados. Toda tabela leva `empresa_id`.
2. Base: autenticação, empresas, perfis, papéis (administrador, vendas, estoque, financeiro) e política RLS por empresa.
3. Cadastros com busca, paginação e validação.
4. Estoque: tabela de movimentos, saldo calculado por visão e alerta de estoque mínimo.
5. Vendas: pedido com itens e função `faturar_pedido`, que em uma transação confere o estoque, grava as saídas, gera os títulos a receber e marca o pedido como faturado. O cancelamento estorna tudo.
6. Financeiro: baixa de títulos, vencidos e fluxo de caixa.
7. Compras: entrada que aumenta o estoque e gera título a pagar.
8. Relatórios: vendas por período, curva ABC e inadimplência.
9. Testes: regras em unidade, isolamento entre empresas e fluxo de venda completo no Playwright.
10. Integração contínua, publicação e dados de demonstração.
11. Estudo de caso: decisões, o que ficou fora e por quê.

## Como deve funcionar

- Faturar um pedido baixa o estoque, cria os títulos e gera o PDF. Sem saldo, a operação inteira é recusada.
- Usuário da empresa A não vê nem altera dados da empresa B, mesmo chamando a API direto.
- Cada papel vê só os módulos que lhe cabem.
- O fluxo de caixa reflete as baixas do dia.

## Como executar

### Requisitos

- Node.js 18+ ou 20+
- npm ou yarn

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/Hey-Pablo/mini-erp.git
cd mini-erp

# 2. Copie o arquivo de ambiente
cp .env.example .env

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente no .env:
#    VITE_SUPABASE_URL - URL do seu projeto Supabase
#    VITE_SUPABASE_ANON_KEY - Chave anônima do Supabase

# 5. Execute o servidor de desenvolvimento
npm run dev

# 6. Abra no navegador
# O servidor abrirá automaticamente em http://localhost:5173
```

### Contas de demonstração

| Email | Senha | Papel |
|-------|-------|-------|
| admin@mini-erp.com | senha123 | administrador |
| vendas@mini-erp.com | vendas123 | vendas |
| estoque@mini-erp.com | estoque123 | estoque |
| financeiro@mini-erp.com | financeiro123 | financeiro |

## Comandos

| Comando | Descrição |
|---------|-------------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Build para produção |
| `npm run preview` | Visualiza o build de produção |
| `npm test` | Executa os testes unitários |
| `npm run test:watch` | Executa os testes em modo watch |
| `npm run lint` | Executa o ESLint |

## Estrutura

```
mini-erp/
├─ src/
│  ├─ app/
│  │  ├─ App.tsx              # Rotas principais com guards
│  │  ├─ DashboardLayout.tsx  # Layout com sidebar por papel
│  │  └─ LoadingSpinner.tsx # Spinner de carregamento
│  ├─ modules/
│  │  ├─ auth/
│  │  │  └─ pages/LoginPage.tsx
│  │  ├─ cadastros/
│  │  │  ├─ pages/ClientesPage.tsx
│  │  │  ├─ clientes/CadastrosClientes.tsx
│  │  │  ├─ fornecedores/...
│  │  │  └─ produtos/...
│  │  └─ vendas/...
│  ├─ shared/
│  │  ├─ api/
│  │  │  ├─ client.ts        # Cliente API (mockável)
│  │  │  ├─ hooks.ts         # Hooks de consulta
│  │  │  └─ types.ts         # Tipos compartilhados
│  │  ├─ auth/
│  │  │  ├─ AuthProvider.tsx # Provider de autenticação
│  │  ├─ lib/
│  │  │  ├─ supabase.ts      # Cliente Supabase
│  │  │  └─ utils.ts         # Funções utilitárias
│  │  ├─ ui/
│  │  │  ├─ Button.tsx
│  │  │  ├─ Pagination.tsx
│  │  │  └─ SearchInput.tsx
│  │  └─ validators/
│  │     ├─ cpf.ts
│  │     └─ cnpj.ts
│  └─ test/setup.ts
├─ supabase/
│  ├─ migrations/
│  └─ seed.sql
├─ dist/                      # Build de produção
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ tailwind.config.js
└─ README.md
```

## Estrutura de Dados (Multiempresa)

Todas as tabelas possuem `empresa_id` para isolamento:

| Tabela | Campos principais |
|--------|------------------|
| empresas | nome, cnpj, inscricao_estadual |
| perfis | id (auth.users), empresa_id, email, role |
| clientes | empresa_id, nome, cpf_cnpj, tipo_pessoa |
| fornecedores | empresa_id, nome, cpf_cnpj, tipo_pessoa |
| produtos | empresa_id, nome, codigo, preco_venda, estoque_atual |

## Prazo

5 a 6 semanas.

## Autor

Pablo Dilio · [Portfólio](https://hey-pablo.github.io/pablo-dilio-portfolio/) · [LinkedIn](https://www.linkedin.com/in/pablo-dilio-4063991b2)
