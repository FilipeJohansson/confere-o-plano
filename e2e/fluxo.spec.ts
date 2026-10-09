import { TOTAL_PERGUNTAS, caminhos, expect, temaPronto, test } from './base';

test('responde o quiz e vê o resultado com citações', async ({ page }, info) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Começar' }).click();

  const progresso = page.getByText(/^\d+ de \d+$/);
  await expect(progresso).toHaveText(/^1 de \d+$/);
  const total = Number((await progresso.textContent())!.split(' de ')[1]);

  // Alterna respostas e pula uma, para cobrir o caso de pergunta pulada.
  const opcoes = ['Concordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Discordo totalmente'];
  for (let i = 0; i < total; i++) {
    await expect(progresso).toHaveText(`${i + 1} de ${total}`);
    if (i === 2) await page.getByRole('button', { name: /Pular/ }).click();
    else await page.getByRole('button', { name: opcoes[i % opcoes.length], exact: true }).click();
  }

  // As respostas não ficam na URL (nem no histórico do navegador).
  await expect(page).toHaveURL(/\/resultado\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/mais próximas do plano|empatadas/);
  await expect(page.getByText(`${total - 1} afirmações respondidas (1 pulada)`, { exact: true })).toBeVisible();

  // Toda citação aponta para o PDF oficial do TSE na página certa.
  const links = page.locator('a[href*="tse.jus.br"][href*="#page="]');
  expect(await links.count()).toBeGreaterThan(20);

  await page.screenshot({ path: `e2e/capturas/resultado-${info.project.name}.png`, fullPage: true });
});

test('link de resultado inválido mostra mensagem', async ({ page }) => {
  await page.goto('/resultado/#r=v0.123');
  await expect(page.getByRole('heading', { name: 'Resultado não encontrado' })).toBeVisible();
});

test('captura da tela do quiz', async ({ page }, info) => {
  await page.goto('/quiz/');
  await page.getByRole('button', { name: 'Entenda o tema' }).click();
  await page.screenshot({ path: `e2e/capturas/quiz-${info.project.name}.png` });
});

test('"Refazer" recomeça o questionário do início', async ({ page }) => {
  await page.goto('/quiz/');
  const progresso = page.getByText(/^\d+ de \d+$/);
  const total = Number((await progresso.textContent())!.split(' de ')[1]);
  for (let i = 0; i < total; i++) {
    await expect(progresso).toHaveText(`${i + 1} de ${total}`);
    await page.getByRole('button', { name: 'Neutro', exact: true }).click();
  }
  await page.getByRole('link', { name: 'Refazer' }).click();
  await expect(progresso).toHaveText(`1 de ${total}`);
  await expect(page.locator('[aria-pressed="true"]')).toHaveCount(0);
});

test('contagem de acessos: só caminhos, e link compartilhado não conta como concluído', async ({ page, contagens }) => {
  await page.goto('/');
  await page.goto('/resultado/#r=v1.' + '2'.repeat(TOTAL_PERGUNTAS));
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect.poll(() => caminhos(contagens)).toEqual(['/', '/resultado/']);
  for (const u of contagens) expect(u).not.toContain('v1.');
});

test('página Sobre traz responsável, fontes com hash e link de correção', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Sobre e metodologia' }).click();
  await expect(page.getByRole('heading', { name: 'Sobre e metodologia' })).toBeVisible();
  await expect(page.getByText('Isto não é uma recomendação de voto')).toBeVisible();
  await expect(page.getByText(/SHA-256: [0-9a-f]{64}/)).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'Abra um pedido de correção' })).toHaveAttribute('href', /\/issues\/new\?template=correcao\.yml/);
});

test('resultado sem respostas na sessão nem no link mostra como recomeçar', async ({ page }) => {
  await page.goto('/resultado/');
  await expect(page.getByRole('heading', { name: 'Resultado não encontrado' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Responder o questionário' })).toBeVisible();
});

test('tema claro por padrão, mesmo com o sistema em escuro; a escolha de escuro fica salva', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const fundo = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  // Mesmo com o sistema em escuro, a página abre no tema claro.
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');
  const claro = await fundo();

  const botao = page.getByRole('button', { name: 'Tema escuro' });
  await temaPronto(page);
  await botao.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await fundo()).not.toBe(claro);

  await page.goto('/quiz/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await temaPronto(page);
  await expect(page.getByRole('button', { name: 'Tema escuro' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Tema escuro' }).click();
  expect(await fundo()).toBe(claro);
});

test('rodapé fica no fim da tela em página curta', async ({ page }) => {
  await page.goto('/resultado/#r=v0.123');
  await expect(page.getByRole('heading', { name: 'Resultado não encontrado' })).toBeVisible();
  const caixa = (await page.locator('footer').boundingBox())!;
  expect(caixa.y + caixa.height).toBeCloseTo(page.viewportSize()!.height, 0);
});

test('botões clicáveis mostram a mãozinha', async ({ page }) => {
  await page.goto('/quiz/');
  await expect(page.getByText(/^1 de \d+$/)).toBeVisible();
  for (const nome of ['Entenda o tema', 'Discordo totalmente', 'Neutro', 'Concordo', 'Pular (não tenho opinião)']) {
    await expect(page.getByRole('button', { name: nome, exact: true })).toHaveCSS('cursor', 'pointer');
  }
  await page.getByRole('button', { name: 'Neutro', exact: true }).click();
  await expect(page.getByRole('button', { name: '← Voltar' })).toHaveCSS('cursor', 'pointer');
});

test('endereço inexistente mostra a página 404 do site', async ({ page }) => {
  const resposta = await page.goto('/pagina-que-nao-existe');
  expect(resposta!.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
  await page.getByRole('link', { name: 'Ir para o início' }).click();
  await expect(page.getByRole('link', { name: 'Começar' })).toBeVisible();
});

test('cabeçalhos de segurança: o site não pode ser embutido em outra página', async ({ page }) => {
  const resposta = await page.goto('/');
  const h = resposta!.headers();
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['x-content-type-options']).toBe('nosniff');
});

test('página com todas as afirmações traz as posições e citações de cada plano', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Ver todas as afirmações/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Todas as afirmações' })).toBeVisible();
  const total = Number((await page.getByText(/As \d+ afirmações do questionário/).textContent())!.match(/\d+/)![0]);
  await expect(page.locator('article')).toHaveCount(total);
  // Duas posições por afirmação, cada uma com pelo menos uma citação com link para o PDF no TSE.
  const primeira = page.locator('article').first();
  await expect(primeira.getByText(/^(Lula|Flávio Bolsonaro)$/)).toHaveCount(2);
  expect(await primeira.locator('a[href*="tse.jus.br"][href*="#page="]').count()).toBeGreaterThanOrEqual(2);
  await expect(page.getByRole('heading', { name: 'O que só um plano propõe' })).toBeVisible();
});

test('compartilhamento: imagem e descrição para a prévia do link', async ({ page, request }) => {
  await page.goto('/');
  const meta = (p: string) => page.locator(`meta[property="${p}"]`).getAttribute('content');
  expect(await meta('og:title')).toBeTruthy();
  expect(await meta('og:description')).toBeTruthy();
  const imagem = new URL(await meta('og:image') as string);
  // A meta aponta para o domínio de produção; aqui confere que o arquivo existe no build.
  const resposta = await request.get(imagem.pathname);
  expect(resposta.status()).toBe(200);
  expect(resposta.headers()['content-type']).toBe('image/png');
});

test('"Recomeçar do início" pede confirmação e volta para a primeira afirmação', async ({ page }) => {
  await page.goto('/quiz/');
  const progresso = page.getByText(/^\d+ de \d+$/);
  await expect(progresso).toHaveText(/^1 de /);
  await expect(page.getByRole('button', { name: 'Recomeçar do início' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Concordo', exact: true }).click();
  await page.getByRole('button', { name: 'Discordo', exact: true }).click();
  await expect(progresso).toHaveText(/^3 de /);

  // Cancelar mantém as respostas.
  await page.getByRole('button', { name: 'Recomeçar do início' }).click();
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await expect(progresso).toHaveText(/^3 de /);

  await page.getByRole('button', { name: 'Recomeçar do início' }).click();
  await page.getByRole('button', { name: 'Sim, recomeçar' }).click();
  await expect(progresso).toHaveText(/^1 de /);
  await expect(page.locator('[aria-pressed="true"]')).toHaveCount(0);
  // O recomeço fica salvo: recarregar não traz as respostas de volta.
  await page.reload();
  await expect(progresso).toHaveText(/^1 de /);
});

test('resultado mostra onde nenhum plano ficou perto da resposta', async ({ page }) => {
  // Tudo neutro: as afirmações com planos nos dois extremos (+2 e -2) aparecem na seção.
  await page.goto(`/resultado/#r=v1.${'2'.repeat(TOTAL_PERGUNTAS)}`);
  const secao = page.locator('section', { has: page.getByRole('heading', { name: 'Onde nenhum plano ficou perto de você' }) });
  await expect(secao).toBeVisible();
  const itens = secao.getByRole('listitem');
  expect(await itens.count()).toBeGreaterThan(0);
  await expect(itens.first()).toContainText('Você: Neutro');
  // O link leva ao cartão detalhado da mesma afirmação.
  const alvo = (await itens.first().getByRole('link').getAttribute('href'))!;
  await expect(page.locator(`article${alvo}`)).toHaveCount(1);
  // A rolagem até o cartão é suave.
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('smooth');
  await itens.first().getByRole('link').click();
  await expect(page.locator(`article${alvo}`)).toBeInViewport();
  // A URL continua com as respostas (num link compartilhado, trocar o "#" apagaria o resultado).
  await expect(page).toHaveURL(/#r=v1\./);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/mais próximas|empatadas/);
});

test('robots.txt e sitemap.xml listam só as páginas indexáveis', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: https://confereoplano.com.br/sitemap.xml');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const p of ['/', '/quiz/', '/afirmacoes/', '/sobre/']) expect(sitemap).toContain(`<loc>https://confereoplano.com.br${p}</loc>`);
  expect(sitemap).not.toContain('resultado');
});
