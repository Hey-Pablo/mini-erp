-- Dados de demonstração para o mini-erp
-- 2 empresas fictícias com usuários e alguns cadastros

-- Empresas
insert into empresas (nome, cnpj, inscricao_estadual, endereco) values
('Comércio São Paulo Ltda', '11.444.777/0001-61', '123456789', '{"rua": "Rua das Flores, 100", "cidade": "São Paulo", "uf": "SP"}'),
('Loja Mato Grosso EIRELI', '45.678.901/0001-23', '987654321', '{"rua": "Av. Brasil, 500", "cidade": "Cuiabá", "uf": "MT"}');

-- Usuários de demonstração (IDs gerados pelo auth.users do Supabase)
-- As senhas são: senha123 e vendas123
-- Os perfis precisam ser criados após os usuários via admin ou manualmente

-- Clientes de demonstração
insert into clientes (empresa_id, nome, tipo_pessoa, cpf_cnpj, email, telefone, ativo) values
('1', 'João Silva Santos', 'F', '123.456.789-00', 'joao.santos@email.com', '(11) 99999-1111', true),
('1', 'Maria Oliveira Costa', 'F', '234.567.890-11', 'maria.costa@email.com', '(11) 98888-2222', true),
('1', 'Tech Solutions LTDA', 'J', '11.222.333/0001-44', 'contato@techsolutions.com.br', '(11) 3333-4444', true),
('2', 'Carlos Mendes Ferreira', 'F', '345.678.901-22', 'carlos.mferreira@email.com', '(65) 99999-3333', true),
('2', 'Padaria Tradicional ME', 'J', '22.333.444/0001-55', 'contato@padariatradicional.com', '(65) 3222-5555', true);

-- Fornecedores de demonstração
insert into fornecedores (empresa_id, nome, tipo_pessoa, cpf_cnpj, email, telefone, ativo) values
('1', 'Distribuidora ABC Ltda', 'J', '12.345.678/0001-90', 'vendas@distabc.com.br', '(11) 4000-1234', true),
('2', 'Forneceira Norte ME', 'J', '33.444.555/0001-66', 'contato@fornecedoranorte.com', '(65) 4333-6666', true);

-- Produtos de demonstração
insert into produtos (empresa_id, codigo, nome, descricao, unidade, preco_venda, preco_custo, estoque_minimo, estoque_atual, ativo) values
('1', 'PROD-001', 'Camiseta Polo Masculina', 'Camiseta polo 100% algodão', 'unid', 79.90, 35.50, 10, 25, true),
('1', 'PROD-002', 'Camiseta Polo Feminina', 'Camiseta polo 100% algodão', 'unid', 79.90, 35.50, 10, 18, true),
('1', 'PROD-003', 'Calça Jeans Social', 'Calça jeans cintura larga', 'unid', 129.90, 55.00, 5, 12, true),
('2', 'PROD-004', 'Café Arábica 500g', 'Café torrado e moído', 'unid', 24.90, 10.00, 15, 30, true),
('2', 'PROD-005', 'Churrasco Bovino 1kg', 'Mistura de cortes para churrasco', 'unid', 49.90, 22.00, 3, 8, true);

-- Usuários de demonstração
-- Precisa ser executado via admin ou diretamente no banco
-- Os seguintes perfis criam usuários no auth.users

-- Administrador da empresa 1
-- email: admin@mini-erp.com, senha: senha123
-- role: admin, empresa_id: 1

-- Usuário vendas da empresa 1
-- email: vendas@mini-erp.com, senha: vendas123
-- role: vendas, empresa_id: 1

-- Observação: Para criar usuários reais, use o método de registro ou admin SQL
-- Comando para criar via admin:
-- insert into auth.users (id, email, encrypted_password, created_at, updated_at) values
--   (uuid_generate_v4(), 'admin@mini-erp.com', '<hash da senha>', now(), now());