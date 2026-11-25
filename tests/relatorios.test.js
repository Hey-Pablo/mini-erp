import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('relatórios isolam empresas, excluem cancelados e classificam títulos vencidos', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role authenticated; create schema auth; create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;`);
    await db.exec(await readFile('supabase/migrations/20261121000000_base.sql', 'utf8'));
    await db.exec(await readFile('supabase/migrations/20261125000000_relatorios.sql', 'utf8'));
    await db.exec(await readFile('supabase/seed.sql', 'utf8'));
    const a='10000000-0000-0000-0000-000000000001', b='10000000-0000-0000-0000-000000000002', u='20000000-0000-0000-0000-000000000001', produto='30000000-0000-0000-0000-000000000001';
    await db.exec(`insert into public.movimentos_estoque(empresa_id,produto_id,quantidade) values ('${a}','${produto}',10); set role authenticated; select set_config('request.jwt.claim.sub','${u}',false);`);
    const pedido=(await db.query(`insert into pedidos(empresa_id,cliente,vencimento) values('${a}','Cliente fictício','2020-01-01') returning id`)).rows[0].id;
    await db.exec(`insert into itens_pedido values('${a}','${pedido}','${produto}',2,20); select faturar_pedido('${a}','${pedido}');`);
    const vendas=await db.query(`select * from relatorio_vendas('${a}',current_date,current_date)`);
    assert.equal(Number(vendas.rows[0].total),40);
    const abc=await db.query(`select * from relatorio_abc('${a}',current_date,current_date)`);
    assert.equal(Number(abc.rows[0].total),40);
    assert.equal(abc.rows[0].classe,'A');
    const atrasados=await db.query(`select * from relatorio_inadimplencia('${a}',current_date)`);
    assert.equal(Number(atrasados.rows[0].valor),40);
    await assert.rejects(db.exec(`select * from relatorio_vendas('${b}',current_date,current_date)`),/Acesso negado/);
    await assert.rejects(db.exec(`select * from relatorio_vendas('${a}',current_date,current_date-1)`),/Período inválido/);
    assert.equal((await db.query(`select * from relatorio_vendas('${a}',current_date-2,current_date-1)`)).rows.length,0);
    const vendedor='20000000-0000-0000-0000-000000000003';
    await db.exec(`insert into perfis values('${a}','${vendedor}','vendas'); select set_config('request.jwt.claim.sub','${vendedor}',false)`);
    await assert.rejects(db.exec(`select * from relatorio_inadimplencia('${a}',current_date)`),/Acesso negado/);
    await db.exec(`select set_config('request.jwt.claim.sub','${u}',false)`);
    await db.exec(`select cancelar_pedido('${a}','${pedido}');`);
    assert.equal((await db.query(`select * from relatorio_vendas('${a}',current_date,current_date)`)).rows.length,0);
    assert.equal((await db.query(`select * from relatorio_inadimplencia('${a}',current_date)`)).rows.length,0);
  } finally { await db.close(); }
});
