<script lang="ts">
  import type { Citacao } from '../lib/schema';
  import Icone from './Icone.svelte';

  let { citacao, url }: { citacao: Citacao; url: string } = $props();
</script>

<blockquote class="border-l-4 border-slate-300 pl-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">
  <p class="italic">“{citacao.trecho}”</p>
  <a
    class="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-900 underline underline-offset-4 dark:text-slate-100"
    href="{url}#page={citacao.pagina}"
    target="_blank"
    rel="noopener"
  >
    página {citacao.pagina}
    <Icone nome="externo" classe="size-3.5" />
  </a>
</blockquote>
