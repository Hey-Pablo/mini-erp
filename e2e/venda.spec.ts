import { test, expect } from '@playwright/test';

test('cria pedido, fatura e baixa documento com API simulada', async ({ page }) => {
  const empresa = '10000000-0000-0000-0000-000000000001';
  const usuario = '20000000-0000-0000-0000-000000000001';
  const produto = '30000000-0000-0000-0000-000000000001';
  const id = '40000000-0000-0000-0000-000000000001';
  let pedido: Record<string, unknown> | null = null;
  let itens: unknown[] = [];
  await page.route('https://example.supabase.co/**', async route => {
    const req = route.request();
    const url = new URL(req.url());
    const user = { id: usuario, email: 'admin@exemplo.test', user_metadata: { nome: 'Admin fictício' }, aud: 'authenticated', role: 'authenticated' };
    const json = (body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.pathname.endsWith('/token')) return json({ access_token: 'token-ficticio', refresh_token: 'refresh-ficticio', token_type: 'bearer', expires_in: 3600, user });
    if (url.pathname.endsWith('/user')) return json(user);
    if (url.pathname.endsWith('/perfis')) return json({ empresa_id: empresa, usuario_id: usuario, papel: 'administrador' });
    if (url.pathname.endsWith('/empresas')) return json({ empresa_id: empresa, nome: 'Empresa fictícia' });
    if (url.pathname.endsWith('/produtos')) return json([{ empresa_id: empresa, id: produto, nome: 'Produto fictício', estoque_minimo: 0 }]);
    if (url.pathname.endsWith('/pedidos') && req.method() === 'POST') { pedido = { ...req.postDataJSON(), id }; return json(pedido, 201); }
    if (url.pathname.endsWith('/itens_pedido') && req.method() === 'POST') { itens = req.postDataJSON(); return json(null, 201); }
    if (url.pathname.endsWith('/pedidos')) return json(pedido ? [{ ...pedido, itens_pedido: itens }] : []);
    if (url.pathname.endsWith('/rpc/faturar_pedido')) { if (pedido) pedido.status = 'faturado'; return json(null); }
    return json({ message: `Rota não simulada: ${url.pathname}` }, 404);
  });
  await page.goto('/login');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByRole('link', { name: 'Pedidos' }).click();
  await page.getByRole('button', { name: 'Novo Pedido' }).click();
  await page.getByPlaceholder('Nome do cliente').fill('Cliente fictício');
  await page.getByTestId('vencimento-input').fill('2030-01-01');
  await page.locator('select').selectOption(produto);
  await page.locator('input[type=number]').nth(1).fill('20');
  await page.getByRole('button', { name: 'Salvar Pedido' }).click();
  await expect(page.getByText('Cliente fictício')).toBeVisible();
  await page.locator('tbody tr').first().locator('button').nth(2).click();
  await expect(page.getByText('Faturado', { exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.locator('tbody tr').first().locator('button').nth(2).click();
  expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
});
