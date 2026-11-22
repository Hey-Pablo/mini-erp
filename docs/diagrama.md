# Diagrama de Dados - Mini ERP

## Modelo Entidade-Relacionamento (simplificado)

```
empresas
├─ id (PK)
├─ nome
├─ cnpj
├─ endereco
├─ created_at
└─ updated_at

perfis
├─ id (PK)
├─ usuario_id (FK → auth.users)
├─ empresa_id (FK → empresas)
├─ papel (administrador|vendas|estoque|financeiro)
└─ created_at

clientes
├─ id (PK)
├─ empresa_id (FK → empresas)
├─ nome
├─ documento (CPF/CNPJ)
├─ tipo_documento
├─ email
├─ telefone
├─ endereco
├─ cidade
├─ uf
├─ cep
├─ ativo
└─ created_at

fornecedores
├─ id (PK)
├─ empresa_id (FK → empresas)
├─ nome
├─ documento
├─ tipo_documento
├─ email
├─ telefone
├─ endereco
├─ cidade
├─ uf
├─ cep
├─ ativo
└─ created_at

produtos
├─ id (PK)
├─ empresa_id (FK → empresas)
├─ codigo
├─ nome
├─ descricao
├─ ncm
├─ cfop_padrao
├─ unidade
├─ preco_custo
├─ preco_venda
├─ estoque_minimo
├─ estoque_atual (via view)
├─ ativo
└─ created_at

pedidos
├─ id (PK)
├─ empresa_id
├─ cliente_id (FK → clientes)
├─ numero
├─ status (rascunho|emitido|faturado|cancelado)
├─ data_emissao
├─ data_faturamento
├─ subtotal
├─ desconto
├─ total
├─ observacoes
└─ created_at

pedido_itens
├─ id (PK)
├─ pedido_id (FK → pedidos)
├─ produto_id (FK → produtos)
├─ quantidade
├─ preco_unitario
├─ desconto
├─ total
└─ created_at

compras
├─ id (PK)
├─ empresa_id
├─ fornecedor_id (FK → fornecedores)
├─ numero
├─ status (rascunho|emitida|recebida|cancelada)
├─ data_emissao
├─ data_recebimento
├─ subtotal
├─ desconto
├─ total
└─ created_at

compra_itens
├─ id (PK)
├─ compra_id (FK → compras)
├─ produto_id (FK → produtos)
├─ quantidade
├─ preco_unitario
├─ desconto
├─ total
└─ created_at

estoque_movimentos
├─ id (PK)
├─ empresa_id
├─ produto_id (FK → produtos)
├─ tipo (entrada|saida|ajuste|devolucao)
├─ quantidade
├─ custo_unitario
├─ documento_tipo
├─ documento_id
├─ observacoes
└─ created_at

titulos
├─ id (PK)
├─ empresa_id
├─ tipo (pagar|receber)
├─ documento_tipo
├─ documento_id
├─ parcela
├─ valor
├─ valor_aberto
├─ data_emissao
├─ data_vencimento
├─ data_baixa
├─ status (aberto|parcial|quitado|cancelado|vencido)
└─ created_at

baixas_titulos
├─ id (PK)
├─ titulo_id (FK → titulos)
├─ valor
├─ data
├─ forma_pagamento
└─ observacoes

fluxo_caixa
├─ id (PK)
├─ empresa_id
├─ data
├─ tipo (entrada|saida)
├─ categoria
├─ descricao
├─ valor
├─ documento_tipo
└─ documento_id
```

## Regras de Negócio

1. **Multiempresa**: Todas as operações são filtradas por `empresa_id`
2. **RLS**: Políticas de segurança no PostgreSQL garantem isolamento
3. **Faturamento**: RPC `faturar_pedido` é transacional
4. **Recebimento**: RPC `receber_compra` atualiza estoque e gera título
5. **Estoque**: Visão `estoque_saldo` calcula saldo por produto
6. **Alertas**: Função `alertas_estoque_minimo` identifica produtos críticos
