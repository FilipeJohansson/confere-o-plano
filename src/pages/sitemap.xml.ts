// Mapa do site para buscadores: só as páginas indexáveis (o resultado e a 404 ficam de fora, com noindex).
import type { APIRoute } from 'astro';

const PAGINAS = ['', 'quiz/', 'afirmacoes/', 'sobre/'];

export const GET: APIRoute = ({ site }) => {
  const base = new URL(import.meta.env.BASE_URL, site);
  const urls = PAGINAS.map((p) => `  <url><loc>${new URL(p, base)}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
