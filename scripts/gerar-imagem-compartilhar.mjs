// Gera public/compartilhar.png (1200x630), a imagem que aparece quando o link do site é compartilhado
// (WhatsApp, redes sociais). Neutra: sem resultado de ninguém, sem nomes, fotos ou cores de campanha.
// Uso: pnpm imagem   (com PW_CHROMIUM=<caminho> se o Chromium do Playwright não estiver instalado)
import { chromium } from '@playwright/test';

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; font-family: ui-sans-serif, system-ui, sans-serif; color: #0f172a; background: #fff;
         display: flex; flex-direction: column; justify-content: space-between; padding: 64px 80px; }
  .marca { font-size: 34px; font-weight: 700; }
  h1 { font-size: 62px; line-height: 1.12; font-weight: 700; letter-spacing: -0.02em; max-width: 1000px; text-wrap: balance; }
  p { font-size: 30px; color: #475569; margin-top: 20px; }
  .info { font-size: 26px; color: #475569; }
</style></head><body>
  <div class="marca">Confere o Plano</div>
  <div>
    <h1>Qual plano de governo do 2º turno combina mais com o que você pensa?</h1>
    <p>Com o trecho e a página de cada plano registrado no TSE.</p>
  </div>
  <div class="info">Eleições 2026 · 2º turno</div>
</body></html>`;

const navegador = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
await pagina.setContent(html);
await pagina.screenshot({ path: 'public/compartilhar.png' });
await navegador.close();
console.log('public/compartilhar.png gerada.');
