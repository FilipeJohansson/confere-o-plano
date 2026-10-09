// Responde o questionário inteiro com escolhas aleatórias, 10 vezes por tamanho de tela.
// Falha se a página registrar qualquer erro (console, exceção, requisição falhada) ou se o
// resultado não bater com as respostas dadas. Em caso de falha, o erro traz o log das escolhas
// em ordem, e o mesmo log fica anexado ao relatório do Playwright.
//
// Para reproduzir uma execução: SEED=<semente base> pnpm exec playwright test e2e/aleatorio.spec.ts -g "#<n>"
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { caminhos, expect, test } from './base';
import { parse } from 'yaml';

interface PerguntaDados {
  id: string;
  afirmacao: string;
  tema: string;
  posicoes: Record<'lula' | 'flavio', { valor: number }>;
}

const perguntas: PerguntaDados[] = parse(readFileSync('data/perguntas.yaml', 'utf8'));
const porAfirmacao = new Map(perguntas.map((p) => [p.afirmacao, p]));

// Rótulo do botão -> valor; null = pular. Pular tem peso menor para a maioria das respostas valer.
const ESCOLHAS: { rotulo: string; valor: number | null; peso: number }[] = [
  { rotulo: 'Discordo totalmente', valor: -2, peso: 2 },
  { rotulo: 'Discordo', valor: -1, peso: 2 },
  { rotulo: 'Neutro', valor: 0, peso: 2 },
  { rotulo: 'Concordo', valor: 1, peso: 2 },
  { rotulo: 'Concordo totalmente', valor: 2, peso: 2 },
  { rotulo: 'Pular', valor: null, peso: 1 },
];

const EXECUCOES = 10;
const SEMENTE_BASE = Number(process.env.SEED ?? Date.now() % 1_000_000);

// PRNG determinístico (mulberry32), para a execução poder ser reproduzida pela semente.
function gerador(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sortear(aleatorio: () => number) {
  const total = ESCOLHAS.reduce((s, e) => s + e.peso, 0);
  let x = aleatorio() * total;
  for (const e of ESCOLHAS) if ((x -= e.peso) < 0) return e;
  return ESCOLHAS[ESCOLHAS.length - 1];
}

function vigiarErros(page: Page, erros: string[]) {
  page.on('console', (m) => m.type() === 'error' && erros.push(`console: ${m.text()} [${m.location().url}]`));
  page.on('pageerror', (e) => erros.push(`exceção: ${e.message}`));
  page.on('requestfailed', (r) => erros.push(`requisição falhou: ${r.url()} (${r.failure()?.errorText})`));
  page.on('response', (r) => r.status() >= 400 && erros.push(`HTTP ${r.status()}: ${r.url()}`));
}

for (let n = 1; n <= EXECUCOES; n++) {
  const semente = SEMENTE_BASE + n;

  test(`respostas aleatórias #${n}`, async ({ page, contagens }, info) => {
    const aleatorio = gerador(semente);
    const erros: string[] = [];
    const log: string[] = [`Semente base ${SEMENTE_BASE}, execução #${n} (semente ${semente}), tela "${info.project.name}"`];
    const respostas: Record<string, number | null> = {};
    vigiarErros(page, erros);
    // Sem Web Share no teste: "Compartilhar" copia o link, que lemos da área de transferência.
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => Object.defineProperty(navigator, 'share', { value: undefined }));

    const falhar = async (motivo: string) => {
      const texto = [...log, '', 'Erros na página:', ...(erros.length ? erros : ['(nenhum)'])].join('\n');
      await info.attach('log-das-escolhas.txt', { body: texto, contentType: 'text/plain' });
      throw new Error(`${motivo}\n\n${texto}`);
    };

    try {
      await page.goto('/quiz/');
      const progresso = page.getByText(/^\d+ de \d+$/);
      await expect(progresso).toHaveText(`1 de ${perguntas.length}`);

      for (let i = 0; i < perguntas.length; i++) {
        await expect(progresso).toHaveText(`${i + 1} de ${perguntas.length}`);
        const afirmacao = (await page.getByRole('heading', { level: 1 }).textContent())!.trim();
        const pergunta = porAfirmacao.get(afirmacao);
        if (!pergunta) await falhar(`Afirmação na tela não existe em data/perguntas.yaml: "${afirmacao}"`);
        if (pergunta!.id in respostas) await falhar(`Afirmação repetida no questionário: ${pergunta!.id}`);

        const escolha = sortear(aleatorio);
        respostas[pergunta!.id] = escolha.valor;
        log.push(`${String(i + 1).padStart(2)}. [${pergunta!.id}] ${afirmacao}\n    → ${escolha.rotulo}`);

        if (escolha.valor === null) await page.getByRole('button', { name: /Pular/ }).click();
        else await page.getByRole('button', { name: escolha.rotulo, exact: true }).click();
      }

      // O código na URL segue a ordem canônica de data/perguntas.yaml.
      const esperado =
        'v1.' + perguntas.map((p) => (respostas[p.id] === null ? '_' : String(respostas[p.id]! + 2))).join('');
      // As respostas não vão para a URL: o resultado é lido da sessão desta aba.
      await expect(page).toHaveURL(/\/resultado\/$/);
      const naSessao = await page.evaluate(() => sessionStorage.getItem('confereoplano:resultado'));
      log.push('', `Código esperado: ${esperado} | guardado na sessão: ${naSessao}`);
      if (naSessao !== esperado) await falhar('O resultado guardado na sessão não corresponde às respostas dadas.');

      const respondidas = perguntas.filter((p) => respostas[p.id] !== null);
      const puladas = perguntas.length - respondidas.length;

      const percentuais: Record<string, string> = {};
      if (respondidas.length === 0) {
        await expect(page.getByRole('heading', { name: 'Nenhuma afirmação respondida' })).toBeVisible();
      } else {
        // Recalcula o alinhamento aqui, de forma independente do código do site.
        for (const plano of ['flavio', 'lula'] as const) {
          const media =
            respondidas.reduce((s, p) => s + 1 - Math.abs(respostas[p.id]! - p.posicoes[plano].valor) / 4, 0) /
            respondidas.length;
          percentuais[plano] = `${Math.round(media * 100)}%`;
          await expect(page.locator(`[data-geral="${plano}"] [data-pct]`)).toHaveText(percentuais[plano]);
        }

        const plural = (q: number, um: string, varios: string) => `${q} ${q === 1 ? um : varios}`;
        const resumo = plural(respondidas.length, 'afirmação respondida', 'afirmações respondidas');
        await expect(
          puladas
            ? page.getByText(`${resumo} (${plural(puladas, 'pulada', 'puladas')})`, { exact: true })
            : page.getByText(`em ${resumo}.`),
        ).toBeVisible();
        await expect(page.locator('article')).toHaveCount(respondidas.length);
      }

      // "Compartilhar" copia a mensagem com os percentuais e o link com as respostas (caminho da área de
      // transferência, já que o teste desliga o menu de compartilhar do sistema).
      if (respondidas.length > 0) {
        await page.getByRole('button', { name: 'Compartilhar resultado' }).click();
        await expect(page.getByRole('button', { name: 'Mensagem copiada!' })).toBeVisible();
        const mensagem = await page.evaluate(() => navigator.clipboard.readText());
        log.push(`Mensagem compartilhada: ${mensagem}`);
        if (!mensagem.endsWith(`/resultado/#r=${esperado}`)) await falhar('O link compartilhado não contém as respostas dadas.');
        if (!mensagem.includes(`Lula (${percentuais.lula})`) || !mensagem.includes(`Flávio Bolsonaro (${percentuais.flavio})`))
          await falhar('A mensagem compartilhada não traz os mesmos percentuais da tela.');
      }

      // Contagem de acessos: o resultado de quem acabou de responder conta como "concluido",
      // e nenhuma contagem pode carregar as respostas.
      await expect.poll(() => caminhos(contagens)).toContain('/resultado/concluido');
      log.push('', `Contagens enviadas: ${caminhos(contagens).join(', ')}`);
      const vazou = contagens.filter((u) => u.includes(esperado) || decodeURIComponent(u).includes('#'));
      if (vazou.length) await falhar(`Contagem de acesso contém as respostas: ${vazou.join(' | ')}`);

      // Dá tempo para erros tardios (hidratação, efeitos) aparecerem.
      await page.waitForLoadState('networkidle');
    } catch (e) {
      if (e instanceof Error && e.message.includes('Semente base')) throw e;
      await falhar(e instanceof Error ? e.message : String(e));
    }

    if (erros.length) await falhar(`A página registrou ${erros.length} erro(s).`);
  });
}
