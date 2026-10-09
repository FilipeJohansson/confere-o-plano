import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Endereço de produção: usado nos links absolutos das meta tags (imagem de compartilhamento, URL canônica).
  site: 'https://confereoplano.com.br',
  integrations: [svelte()],
  vite: { plugins: [tailwindcss()] },
});
