import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('isolamento, compra, faturamento, estorno e baixas', async () => {
 const db = new PGlite();
 try {
  await db.exec(`CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;`);
  await db.exec(await readFile('supabase/migrations/20261121000000_base.sql','utf8'));
  await db.exec(await readFile('supabase/seed.sql','utf8'));
  const a='10000000-0000-0000-0000-000000000001', b='10000000-0000-0000-0000-000000000002', u='20000000-0000-0000-0000-000000000001', produto='30000000-0000-0000-0000-000000000001';
  await db.exec(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${u}',false);`);
  assert.equal((await db.query('select * from empresas')).rows.length,1);
  assert.equal((await db.query(`select * from produtos where empresa_id='${b}'`)).rows.length,0);
  await assert.rejects(db.exec(`insert into produtos(empresa_id,nome) values('${b}','Invasão')`),/row-level security/);
  const compra=(await db.query(`insert into compras(empresa_id,fornecedor,vencimento) values('${a}','Fornecedor fictício','2030-01-01') returning id`)).rows[0].id;
  await db.exec(`insert into itens_compra values('${a}','${compra}','${produto}',5,10); select receber_compra('${a}','${compra}');`);
  assert.equal(Number((await db.query('select saldo from saldo_estoque')).rows[0].saldo),5);
  const pedido=(await db.query(`insert into pedidos(empresa_id,cliente,vencimento) values('${a}','Cliente fictício','2030-01-01') returning id`)).rows[0].id;
  await db.exec(`insert into itens_pedido values('${a}','${pedido}','${produto}',6,20)`);
  await assert.rejects(db.exec(`select faturar_pedido('${a}','${pedido}')`),/Estoque insuficiente/);
  assert.equal((await db.query(`select status from pedidos where id='${pedido}'`)).rows[0].status,'aberto');
  assert.equal(Number((await db.query('select saldo from saldo_estoque')).rows[0].saldo),5);
  const pedido2=(await db.query(`insert into pedidos(empresa_id,cliente,vencimento) values('${a}','Cliente fictício','2030-01-01') returning id`)).rows[0].id;
  await db.exec(`insert into itens_pedido values('${a}','${pedido2}','${produto}',2,20); select faturar_pedido('${a}','${pedido2}');`);
  assert.equal(Number((await db.query('select saldo from saldo_estoque')).rows[0].saldo),3);
  const titulo=(await db.query(`select id,valor from titulos where pedido_id='${pedido2}'`)).rows[0];
  assert.equal(Number(titulo.valor),40);
  await db.exec(`select cancelar_pedido('${a}','${pedido2}')`);
  assert.equal(Number((await db.query('select saldo from saldo_estoque')).rows[0].saldo),5);
  assert.equal((await db.query(`select status from titulos where id='${titulo.id}'`)).rows[0].status,'cancelado');
  const pagar=(await db.query(`select id from titulos where compra_id='${compra}'`)).rows[0].id;
  await db.exec(`select baixar_titulo('${a}','${pagar}')`);
  assert.equal((await db.query(`select status from titulos where id='${pagar}'`)).rows[0].status,'baixado');
  await assert.rejects(db.exec(`select baixar_titulo('${a}','${pagar}')`),/Título não está aberto/);
  await assert.rejects(db.exec(`select receber_compra('${a}','${compra}')`),/Compra não está aberta/);
  await assert.rejects(db.exec(`select faturar_pedido('${b}','${pedido}')`),/Acesso negado/);
  const vendedor='20000000-0000-0000-0000-000000000003';
  await db.exec(`insert into perfis values('${a}','${vendedor}','vendas'); select set_config('request.jwt.claim.sub','${vendedor}',false);`);
  assert.equal((await db.query('select * from titulos')).rows.length,0);
  await assert.rejects(db.exec(`select baixar_titulo('${a}','${pagar}')`),/Acesso negado/);
  await assert.rejects(db.exec(`select receber_compra('${a}','${compra}')`),/Acesso negado/);
  await assert.rejects(db.exec(`insert into perfis values('${a}','${vendedor}','administrador')`),/row-level security/);
 } finally { await db.close(); }
});
