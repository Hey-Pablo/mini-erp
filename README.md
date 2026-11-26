# Mini ERP - Sistema Multiempresa

> **Demonstração:** em breve

> **Status:** concluído. Cadastros, vendas (com PDF), compras, estoque, financeiro e relatórios estão na `main`, com testes de banco (PGlite), 76 testes de tela, e2e Playwright e CI. Falta apenas a publicação (Vercel) por conta do Pablo.

## Problema e solução

Um pequeno comércio precisa acompanhar pedidos, estoque e títulos sem misturar dados de empresas diferentes. Este projeto explora um ERP enxuto com React e PostgreSQL, usando dados fictícios. O faturamento gera um documento interno em PDF; ele não é uma nota fiscal e não tem valor fiscal.

## Arquitetura e decisões

O navegador usa React, TypeScript e Vite. O cliente Supabase consulta PostgreSQL e autentica usuários. Cada registro operacional tem `empresa_id`; RLS verifica o vínculo e o papel do usuário. As funções PL/pgSQL de faturamento, cancelamento, recebimento de compra e baixa validam permissões no banco. Faturar bloqueia produtos, verifica saldo e registra estoque e título na mesma transação. Cancelar estorna estoque e cancela o título se ele não tiver sido baixado.

O teste de banco usa PGlite com um shim para `auth.uid()` e o papel `authenticated`. Ele aplica as migrations e exercita funções e RLS sem conta externa. Testes de interface usam Vitest; o fluxo de venda tem Playwright com respostas de API simuladas. O CI executa as verificações sem banco hospedado. O mock do navegador não comprova integração real com Supabase; os testes SQL verificam as regras diretamente.

## Relatórios

Disponíveis para administradores, com período inclusivo. As vendas e a curva ABC usam a data UTC da saída de estoque no faturamento e excluem pedidos cancelados. A curva ordena produtos pelo valor vendido e classifica pelo percentual acumulado anterior: A até 80%, B até 95% e C acima disso. A inadimplência mostra títulos a receber abertos com vencimento anterior à data final escolhida.

## O que ficou fora

- NF-e real: exige certificado, credenciamento e integração fiscal; o PDF é apenas interno.
- Integrações bancárias e pagamento: não há comunicação com bancos ou processamento de valores reais.
- Produção e alta disponibilidade: não há deploy nem banco hospedado mantido pelo projeto.
- Alguns cadastros e campos do front ainda não correspondem ao esquema SQL; revise-os antes de usar com dados reais. O projeto é uma demonstração, não um ERP de produção.

## Configurar o banco

O repositório não inclui um banco hospedado nem credenciais reais. Para conectar sua própria instância Supabase:

1. Crie um projeto Supabase sob sua responsabilidade.
2. Instale a CLI Supabase. Execute `supabase init` se ainda não houver `supabase/config.toml`.
3. Execute `supabase login` e `supabase link --project-ref SEU_PROJECT_REF` para conectar o diretório ao projeto escolhido.
4. Aplique as migrações com `supabase db push`.
5. Execute `supabase/seed.sql` no editor SQL do projeto para carregar dados fictícios.
6. Crie usuários no Supabase Auth e associe seus IDs aos papéis na tabela `perfis`, para a empresa desejada. Substitua os IDs fictícios do seed.
7. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os dados públicos do seu projeto. Nunca use a chave de serviço no navegador.
8. Rode `npm ci` e `npm run dev`; entre com um usuário criado no passo 6.

Sem as duas variáveis, a aplicação exibe uma orientação para configurar o banco. PGlite nos testes não é um servidor Supabase e não fornece autenticação ou API ao navegador. Um PostgreSQL próprio também precisa oferecer autenticação compatível com `auth.uid()`, os papéis usados pelas políticas e uma API compatível com o cliente Supabase; apenas aplicar os arquivos com `psql -f` não fornece esses serviços.

## Executar e testar

```bash
npm ci
npm run dev
npm test
npm run lint
npx tsc --noEmit
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm test` executa Vitest e testes SQL em PGlite. Playwright inicia o Vite e intercepta as chamadas de rede com dados fictícios; não exige banco remoto. Os comandos dependem das partes de CI e Playwright incluídas nos respectivos PRs.

## Estrutura

- `src/app`: rotas e layout.
- `src/modules`: telas de cadastros, vendas, compras, estoque e financeiro.
- `src/shared`: cliente, autenticação, contexto e componentes.
- `supabase/migrations` e `supabase/seed.sql`: modelo, políticas, funções e dados fictícios.
- `tests`: testes SQL locais; `e2e`: fluxo de venda simulado.

## Uso de IA

IA auxiliou na implementação e revisão; as regras e seus limites estão documentados para permitir inspeção e testes independentes.

## Autor

Pablo Dilio · [Portfólio](https://hey-pablo.github.io/pablo-dilio-portfolio/) · [LinkedIn](https://www.linkedin.com/in/pablo-dilio-4063991b2)

## Licença

MIT
