// Base comum dos testes: troca o script do GoatCounter por um substituto local que registra o que seria
// enviado. Assim os testes não dependem de rede e conseguem verificar que nenhuma resposta vaza na contagem.
import { readFileSync } from 'node:fs';
import { test as base } from '@playwright/test';
import { parse } from 'yaml';

// Imita o essencial do count.js: usa window.goatcounter.path quando definido e chama o endpoint de contagem.
const SCRIPT_FALSO = `(() => {
  const script = document.querySelector('script[data-goatcounter]');
  const gc = window.goatcounter || {};
  const padrao = location.pathname + location.search;
  const caminho = typeof gc.path === 'function' ? gc.path(padrao) : padrao;
  const endpoint = gc.endpoint || script.dataset.goatcounter;
  fetch(endpoint + '?p=' + encodeURIComponent(caminho) + '&r=' + encodeURIComponent(document.referrer), { mode: 'no-cors' });
})();`;

export const test = base.extend<{ contagens: string[] }>({
  contagens: [
    async ({ page }, use) => {
      const contagens: string[] = [];
      await page.route('https://gc.zgo.at/count.js', (r) =>
        r.fulfill({ contentType: 'application/javascript', body: SCRIPT_FALSO }),
      );
      await page.route(/goatcounter\.com\/count/, (r) => {
        contagens.push(r.request().url());
        return r.fulfill({ status: 204 });
      });
      await use(contagens);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';

/** Caminhos contados, decodificados (ex.: "/quiz/"). */
export const caminhos = (contagens: string[]) => contagens.map((u) => new URL(u).searchParams.get('p'));

/** Total de perguntas em data/perguntas.yaml (o código de respostas tem um caractere por pergunta). */
export const TOTAL_PERGUNTAS: number = parse(readFileSync('data/perguntas.yaml', 'utf8')).length;

/** Código de respostas válido com todas as opções da escala e uma pulada, para abrir o resultado direto. */
export const CODIGO_EXEMPLO = 'v1.' + Array.from({ length: TOTAL_PERGUNTAS }, (_, i) => (i === 2 ? '_' : String(i % 5))).join('');

/** Espera o botão de tema ficar interativo (o Astro tira o atributo "ssr" da ilha depois de hidratá-la). */
export const temaPronto = (page: import('@playwright/test').Page) =>
  page.locator('astro-island[component-url*="BotaoTema"]:not([ssr])').waitFor({ state: 'attached' });
