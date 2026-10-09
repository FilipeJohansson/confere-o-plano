<script lang="ts">
  // O que não entra no cálculo: propostas de um plano só, pontos de consenso e temas mostrados lado a lado.
  import { NOME_PLANO } from '../lib/rotulos';
  import { PLANOS, type PlanoId } from '../lib/planos';
  import type { Informativo, Plano, Tema } from '../lib/schema';
  import Citacao from './Citacao.svelte';

  let { temas, informativo, planos }: { temas: Tema[]; informativo: Informativo; planos: Record<PlanoId, Plano> } = $props();
</script>

<section class="flex flex-col gap-4">
  <div>
    <h2 class="titulo-secao">O que só um plano propõe</h2>
    <p class="text-sm text-slate-600 dark:text-slate-400">
      Propostas que aparecem em apenas um dos planos. Não entram no cálculo, porque o outro plano não fala do assunto.
    </p>
  </div>
  {#each temas as t (t.id)}
    {@const itens = informativo.so_um_lado.filter((i) => i.tema === t.id)}
    {#if itens.length}
      <div class="flex flex-col gap-3">
        <h3 class="text-sm font-bold">{t.nome}</h3>
        {#each itens as item (item.id)}
          <div class="flex flex-col gap-2 cartao p-4">
            <p class="text-sm">
              <span class="font-semibold {NOME_PLANO[item.plano].cor}">{NOME_PLANO[item.plano].nome}:</span>
              {item.assunto}
            </p>
            {#each item.citacoes as c, i (i)}
              <Citacao citacao={c} url={planos[item.plano].url} />
            {/each}
          </div>
        {/each}
      </div>
    {/if}
  {/each}
</section>

{#snippet comparados(itens: Informativo['consenso'])}
  {#each itens as item (item.id)}
    <div class="flex flex-col gap-3 cartao p-4">
      <p class="text-sm font-semibold">{item.assunto}</p>
      {#if item.nota}<p class="text-xs text-slate-600 dark:text-slate-400">{item.nota}</p>{/if}
      <div class="grid gap-3 sm:grid-cols-2">
        {#each PLANOS as p (p)}
          <div class="flex flex-col gap-2">
            <span class="text-xs font-semibold {NOME_PLANO[p].cor}">{NOME_PLANO[p].nome}</span>
            {#each item[p] as c, i (i)}
              <Citacao citacao={c} url={planos[p].url} />
            {/each}
          </div>
        {/each}
      </div>
    </div>
  {/each}
{/snippet}

<section class="flex flex-col gap-4">
  <div>
    <h2 class="titulo-secao">Onde os planos concordam</h2>
    <p class="text-sm text-slate-600 dark:text-slate-400">Pontos em que os dois propõem praticamente o mesmo.</p>
  </div>
  {@render comparados(informativo.consenso)}
</section>

<section class="flex flex-col gap-4">
  <div>
    <h2 class="titulo-secao">Lado a lado</h2>
    <p class="text-sm text-slate-600 dark:text-slate-400">
      Temas sensíveis em que comparar exigiria interpretar o texto. Mostramos o que cada plano diz, sem pontuar.
    </p>
  </div>
  {@render comparados(informativo.lado_a_lado)}
</section>
