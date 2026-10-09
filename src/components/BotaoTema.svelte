<script lang="ts">
  // Botão de alternar entre tema claro (padrão) e escuro; a escolha fica salva neste navegador.
  import { onMount } from 'svelte';
  import { CHAVE_TEMA } from '../lib/tema';
  import Icone from './Icone.svelte';

  let escuro = $state(false);

  onMount(() => {
    escuro = document.documentElement.dataset.theme === 'dark';
  });

  function alternar() {
    escuro = !escuro;
    document.documentElement.dataset.theme = escuro ? 'dark' : 'light';
    try {
      localStorage.setItem(CHAVE_TEMA, escuro ? 'dark' : 'light');
    } catch {}
  }
</script>

<button
  type="button"
  class="grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
  aria-label="Tema escuro"
  aria-pressed={escuro}
  title={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
  onclick={alternar}
>
  <Icone nome={escuro ? 'sol' : 'lua'} classe="size-5" />
</button>
