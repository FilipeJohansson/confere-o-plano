<script lang="ts">
  import type { OpcaoEscala } from '../lib/rotulos';

  let { nome, classe = 'size-6' }: { nome: OpcaoEscala['icone'] | 'externo' | 'sol' | 'lua'; classe?: string } = $props();

  // Traços no estilo Lucide (viewBox 24x24).
  const X = 'M18 6 6 18M6 6l12 12';
  const CHECK = 'M20 6 9 17l-5-5';
</script>

<svg class={classe} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  {#if nome === 'x'}
    <path d={X} />
  {:else if nome === 'x2'}
    <!-- Um X na frente e outro atrás, deslocado para a direita (mesma ideia do check2). -->
    <path d="M3 7l10 10M13 7 3 17" />
    <path d="M15.5 10.5 21 16M15.5 13.5 21 8" />
  {:else if nome === 'menos'}
    <path d="M5 12h14" />
  {:else if nome === 'check'}
    <path d={CHECK} />
  {:else if nome === 'check2'}
    <path d="M17 6 7 16l-4-4" />
    <path d="m22 8-7.5 7.5L13 14" />
  {:else if nome === 'sol'}
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  {:else if nome === 'lua'}
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  {:else if nome === 'externo'}
    <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  {/if}
</svg>
