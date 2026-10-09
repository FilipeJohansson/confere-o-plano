// Gera public/compartilhar.png (1200x630), a imagem que aparece quando o link do site é compartilhado
// (WhatsApp, redes sociais). Neutra: sem resultado de ninguém, sem nomes, fotos ou cores de campanha.
// Uso: pnpm imagem   (com PW_CHROMIUM=<caminho> se o Chromium do Playwright não estiver instalado)
import { chromium } from '@playwright/test';

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; font-family: ui-sans-serif, system-ui, sans-serif; color: #0f172a; background: #fff;
         display: flex; flex-direction: column; justify-content: space-between; padding: 64px 80px; }
  .marca { font-size: 34px; font-weight: 700; display: flex; align-items: center; gap: 16px; }
  .icone { width: 56px; height: 56px; border-radius: 14px; background: #0f172a; display: grid; place-items: center; }
  h1 { font-size: 62px; line-height: 1.12; font-weight: 700; letter-spacing: -0.02em; max-width: 1000px; text-wrap: balance; }
  p { font-size: 30px; color: #475569; margin-top: 20px; text-wrap: balance; }
  .info { font-size: 26px; color: #475569; }
</style></head><body>
  <div class="marca"><span class="icone"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></span>Confere o Plano</div>
  <div>
    <h1>Com qual plano de governo você concorda mais?</h1>
    <p>Responda e confira nas fontes: o trecho e a página de cada plano registrado no TSE.</p>
  </div>
  <div class="info">Eleições 2026 · 2º turno</div>
</body></html>`;

const navegador = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
await pagina.setContent(html);
await pagina.screenshot({ path: 'public/compartilhar.png' });
await navegador.close();
console.log('public/compartilhar.png gerada.');
