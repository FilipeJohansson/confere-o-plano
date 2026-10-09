<script lang="ts">
  // Uma afirmação com o que cada plano diz e onde. Usado no resultado (com a resposta da pessoa) e na
  // página "Todas as afirmações" (sem resposta).
  import { urlCorrecao } from '../lib/projeto';
  import { NOME_PLANO, POSICAO_PLANO, opcao, pct } from '../lib/rotulos';
  import { PLANOS, type PlanoId } from '../lib/planos';
  import type { Pergunta, Plano } from '../lib/schema';
  import Citacao from './Citacao.svelte';
  import Icone from './Icone.svelte';

  let {
    pergunta,
    nomeTema,
    planos,
    resposta,
    concordancia,
  }: {
    pergunta: Pergunta;
    nomeTema?: string;
    planos: Record<PlanoId, Plano>;
    /** Resposta da pessoa (-2..2); sem ela, o cartão mostra só as posições dos planos. */
    resposta?: number;
    concordancia?: Record<PlanoId, number>;
  } = $props();
</script>

<article class="cartao flex scroll-mt-32 flex-col gap-4 p-5" id={pergunta.id}>
  <div class="flex flex-col gap-2">
    {#if nomeTema}
      <span class="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">{nomeTema}</span>
    {/if}
    <h3 class="text-lg font-bold text-balance">{pergunta.afirmacao}</h3>
    {#if resposta !== undefined}
      {@const op = opcao(resposta)}
      <div>
        <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold {op.cor}">
          <Icone nome={op.icone} classe="size-3.5" />
          Você: {op.texto}
        </span>
      </div>
    {:else if pergunta.contexto}
      <p class="text-sm text-slate-600 dark:text-slate-400">{pergunta.contexto}</p>
    {/if}
  </div>
  <div class="grid gap-4 sm:grid-cols-2">
    {#each PLANOS as p (p)}
      {@const pos = pergunta.posicoes[p]}
      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <span class="text-sm font-semibold {NOME_PLANO[p].cor}">{NOME_PLANO[p].nome}</span>
          <span class="text-xs text-slate-600 dark:text-slate-400">
            {POSICAO_PLANO[pos.valor]}{#if concordancia} · {pct(concordancia[p])} com você{/if}
          </span>
        </div>
        <p class="text-sm">{pos.resumo}</p>
        {#if pos.inferencia}
          <p class="rounded-lg bg-amber-50 p-2 text-xs text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
            <strong>Posição inferida.</strong>
            {pos.inferencia}
          </p>
        {/if}
        {#each pos.citacoes as c, i (i)}
          <Citacao citacao={c} url={planos[p].url} />
        {/each}
      </div>
    {/each}
  </div>
  <a
    class="self-start text-xs text-slate-600 underline underline-offset-4 dark:text-slate-400"
    href={urlCorrecao(pergunta)}
    target="_blank"
    rel="noopener"
  >
    Encontrou um erro nesta afirmação? Avise
  </a>
</article>
