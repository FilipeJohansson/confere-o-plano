// Verificação automática de acessibilidade (axe-core, regras WCAG 2.1 A e AA) em todas as páginas,
// nos temas claro e escuro. Não substitui teste com leitor de tela, mas pega contraste, rótulos e estrutura.
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { CODIGO_EXEMPLO, expect, test } from './base';

const PAGINAS: [string, string][] = [
  ['início', '/'],
  ['questionário', '/quiz/'],
  ['resultado', `/resultado/#r=${CODIGO_EXEMPLO}`],
  ['sobre', '/sobre/'],
  ['todas as afirmações', '/afirmacoes/'],
  ['404', '/nao-existe'],
];

async function analisar(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  // Mensagem legível: regra, gravidade e até 3 elementos de exemplo.
  return violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help}\n${v.nodes
      .slice(0, 3)
      .map((n) => `    ${n.target.join(' ')} ${n.failureSummary?.split('\n').slice(1).join(' ') ?? ''}`)
      .join('\n')}`,
  );
}

for (const tema of ['light', 'dark'] as const) {
  for (const [nome, caminho] of PAGINAS) {
    test(`acessibilidade: ${nome} (${tema === 'light' ? 'claro' : 'escuro'})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('confereoplano:tema', t), tema);
      await page.goto(caminho);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      if (caminho === '/quiz/') await page.getByRole('button', { name: 'Entenda o tema' }).click();
      // Garante que o resultado analisado é um resultado de verdade, não a mensagem de link inválido.
      if (caminho.startsWith('/resultado/')) await expect(page.getByRole('heading', { level: 1 })).toContainText(/mais próximas|empatadas/);
      expect(await analisar(page)).toEqual([]);
    });
  }
}
