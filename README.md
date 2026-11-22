# Mini ERP Multiempresa

> **Demonstração:** em breve

ERP enxuto para pequeno comércio, com várias empresas isoladas no mesmo banco: cadastros, vendas, compras, estoque, financeiro e relatórios. Simula o faturamento com documento interno em PDF. Não emite NF-e real, que exige certificado digital e credenciamento.

## O que prova

Arquitetura multiempresa, regras de negócio transacionais no banco, testes de ponta a ponto e o domínio que você conhece por dentro.

## Stack

React, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form e Zod. Supabase (PostgreSQL, RLS, funções em PL/pgSQL). Geração de PDF com pdf-lib. Testes com Vitest e Testing Library.

## Estrutura

```
mini-erp/
├─ src/
│  ├─ app/                 # Layout, Login, Dashboard
│  ├─ modules/
│  │  ├─ cadastros/        # clientes, fornecedores, produtos
│  │  ├─ vendas/           # pedido, faturamento, PDF
│  │  ├─ compras/          # pedidos de compra
│  │  ├─ estoque/          # movimentos, saldo, inventário
│  │  ├─ financeiro/       # contas a pagar e receber, fluxo de caixa
│  │  ├─ relatorios/
│  │  └─ admin/            # empresa, usuários, papéis
│  └─ shared/              # ui, hooks, supabase, tipos
├─ supabase/
│  └─ migrations/          # tabelas com empresa_id, RLS
├─ e2e/
├─ docs/
└─ README.md
```

## Tela Inicial

O projeto inclui as seguintes telas prontas:

### 1. Dashboard
Visão geral com estatísticas de pedidos, estoque, clientes e faturamento.

### 2. Cadastros
- **Clientes**: Cadastro com CPF/CNPJ, validação automática, busca e gestão
- **Fornecedores**: Cadastro com CPF/CNPJ, contato e endereço
- **Produtos**: Controle de código, NCM, unidade, preço de custo/venda e estoque mínimo

### 3. Vendas
- **Pedidos de Venda**: Criação, edição, listagem com itens
- **Faturamento**: RPC `faturar_pedido` que baixa estoque, gera títulos e cria PDF
- **PDF**: Geração de documento interno usando pdf-lib

### 4. Compras
- **Pedidos de Compra**: entrada de mercadorias, gera título a pagar
- **Recebimento**: confirmação de entrada, aumenta estoque

### 5. Estoque
- **Movimentos**: registro de entrada, saída, ajuste e devolução
- **Alertas**: produtos com estoque abaixo do mínimo
- **Saldo**: visualização em tempo real

### 6. Financeiro
- **Títulos a Pagar/Receber**: controle de parcelas com status
- **Baixa**: registro de pagamento/recebimento
- **Fluxo de Caixa**: lançamentos diários de entrada/saída
- **Dashboard**: resumo de saldo, entradas e saídas

### 7. Relatórios
- **Vendas por Período**: faturamento, pedidos, clientes
- **Top Produtos**: os mais vendidos
- **Evolução Mensal**: gráfico de vendas

## Como executar

### Requisitos
- Node.js 18+ 
- Conta Supabase (ou instância local)

### Desenvolvimento

```bash
# Clone o repositório
git clone https://github.com/Hey-Pablo/mini-erp.git
cd mini-erp

# Instale dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# Execute em modo desenvolvimento
npm run dev
```

### Credenciais de demonstração

Um banco de demonstração com 2 empresas está disponível. Crie um usuário ou use as credenciais de teste:
- Email: `admin@demo.com`
- Senha: `123456`

## Configuração Supabase

O projeto requer as seguintes tabelas (migrações):

```sql
-- Empresas
CREATE TABLE empresas (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Usuários e perfis
CREATE TABLE perfis (
  id UUID PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users,
  empresa_id UUID REFERENCES empresas,
  papel TEXT CHECK (papel IN ('administrador', 'vendas', 'estoque', 'financeiro')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cadastros
CREATE TABLE clientes (...);
CREATE TABLE fornecedores (...);
CREATE TABLE produtos (...);

-- Vendas
CREATE TABLE pedidos (...);
CREATE TABLE pedido_itens (...);

-- Compras
CREATE TABLE compras (...);
CREATE TABLE compra_itens (...);

-- Estoque
CREATE TABLE estoque_movimentos (...);
CREATE VIEW estoque_saldo AS ...;

-- Financeiro
CREATE TABLE titulos (...);
CREATE TABLE baixas_titulos (...);
CREATE TABLE fluxo_caixa (...);
```

## Testes

```bash
# Testes unitários
npm run test

# Testes com watch
npm run test:watch
```

## Decisões técnicas

1. **Multiempresa**: Todas as tabelas têm `empresa_id` com RLS (Row Level Security) no PostgreSQL
2. **PDF**: Usamos pdf-lib para gerar documentos internos de faturamento (não NF-e real)
3. **RPC**: Funções `faturar_pedido` e `receber_compra` em PL/pgSQL para operações transacionais
4. **Autenticação**: Supabase Auth com JWT e políticas de acesso baseadas em papéis

## Limitações

- NF-e não é emitida (requer certificado digital e credenciamento)
- Documento PDF é apenas interno, não substitui nota fiscal
- O projeto é uma simulação para fins educacionais

## Próximos passos

- [ ] Integração com pagamento via Pix
- [ ] API REST para consumo externo
- [ ] Exportação de relatórios em Excel/CSV

## Licença

MIT - Para fins educacionais e demonstração de portfólio.

## Autor

Pablo Dilio · [Portfólio](https://hey-pablo.github.io/pablo-dilio-portfolio/) · [LinkedIn](https://www.linkedin.com/in/pablo-dilio-4063991b2)
