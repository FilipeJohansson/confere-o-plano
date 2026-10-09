<script lang="ts">
  import { onMount } from 'svelte';
  import { CHAVE_CONCLUIU } from '../lib/contagem';
  import { CHAVE_RESULTADO, codificar } from '../lib/encode';
  import { ESCALA } from '../lib/rotulos';
  import type { Pergunta, Resposta, Tema } from '../lib/schema';
  import Icone from './Icone.svelte';

  type PerguntaQuiz = Pick<Pergunta, 'id' | 'tema' | 'afirmacao' | 'contexto'>;
  let {
    perguntas,
    temas,
    base,
  }: {
    perguntas: PerguntaQuiz[];
    temas: Tema[];
    base: string;
  } = $props();

  const CHAVE = 'confereoplano:quiz:v1';
  const porId = new Map(perguntas.map((p) => [p.id, p]));
  const nomeTema = new Map(temas.map((t) => [t.id, t.nome]));

  // Temas na ordem do TSE; dentro de cada tema, ordem aleatória (evita efeito de ordem).
  function novaOrdem(): string[] {
    return temas.flatMap((t) => {
      const ids = perguntas.filter((p) => p.tema === t.id).map((p) => p.id);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      return ids;
    });
  }

  let ordem = $state<string[]>([]);
  let respostas = $state<Record<string, Resposta>>({});
  let indice = $state(0);
  let mostrarContexto = $state(false);
  let confirmarRecomeco = $state(false);
  // Depois de terminar, o progresso não é mais salvo; senão "Refazer" voltaria para a última pergunta.
  let terminado = false;

  const atual = $derived(porId.get(ordem[indice]));
  const respostaAtual = $derived(atual ? respostas[atual.id] : undefined);

  onMount(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? 'null');
      const mesmoConjunto =
        Array.isArray(salvo?.ordem) &&
        salvo.ordem.length === perguntas.length &&
        salvo.ordem.every((id: string) => porId.has(id));
      if (mesmoConjunto) {
        ordem = salvo.ordem;
        respostas = salvo.respostas ?? {};
        indice = Math.min(salvo.indice ?? 0, perguntas.length - 1);
        return;
      }
    } catch {
      // Sem acesso ao armazenamento (aba anônima, bloqueio): começa do zero.
    }
    ordem = novaOrdem();
  });

  $effect(() => {
    const estado = { ordem, respostas: { ...respostas }, indice };
    if (!ordem.length || terminado) return;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch {}
  });

  function responder(valor: Resposta) {
    if (!atual) return;
    respostas[atual.id] = valor;
    mostrarContexto = false;
    if (indice < ordem.length - 1) {
      indice++;
      return;
    }
    terminado = true;
    // A codificação usa a ordem canônica de data/perguntas.yaml, não a ordem embaralhada.
    const codigo = codificar(perguntas, respostas);
    // As respostas não vão para a URL (ficariam no histórico do navegador); o resultado lê da sessão.
    // Sem sessionStorage (bloqueado), cai para a URL para o resultado ainda funcionar.
    try {
      localStorage.removeItem(CHAVE);
      sessionStorage.setItem(CHAVE_RESULTADO, codigo);
      sessionStorage.setItem(CHAVE_CONCLUIU, '1');
      location.href = `${base}resultado/`;
    } catch {
      location.href = `${base}resultado/#r=${codigo}`;
    }
  }

  // Apaga as respostas salvas e sorteia uma nova ordem.
  function recomecar() {
    respostas = {};
    ordem = novaOrdem();
    indice = 0;
    mostrarContexto = false;
    confirmarRecomeco = false;
  }

  function voltar() {
    if (indice > 0) {
      indice--;
      mostrarContexto = false;
    }
  }

  function teclado(e: KeyboardEvent) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const n = Number(e.key);
    if (n >= 1 && n <= 5) responder(ESCALA[n - 1].valor);
    else if (e.key === 'ArrowLeft') voltar();
  }
</script>

<svelte:window onkeydown={teclado} />

{#if atual}
  <div class="flex flex-col gap-6">
    <div>
      <div class="mb-2 flex items-baseline justify-between gap-4 text-sm text-slate-600 dark:text-slate-400">
        <span class="font-medium">{nomeTema.get(atual.tema)}</span>
        <span class="shrink-0 whitespace-nowrap tabular-nums">{indice + 1} de {ordem.length}</span>
      </div>
      <div
        class="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={ordem.length}
        aria-valuenow={indice}
        aria-label="Progresso"
      >
        <div class="h-full rounded-full bg-slate-700 transition-all dark:bg-slate-300" style="width: {(indice / ordem.length) * 100}%"></div>
      </div>
    </div>

    <h1 class="min-h-32 text-2xl leading-snug font-semibold text-balance sm:text-3xl" aria-live="polite">
      {atual.afirmacao}
    </h1>

    {#if atual.contexto}
      <div>
        <button
          type="button"
          class="text-sm font-medium text-slate-700 underline underline-offset-4 dark:text-slate-300"
          aria-expanded={mostrarContexto}
          onclick={() => (mostrarContexto = !mostrarContexto)}
        >
          {mostrarContexto ? 'Esconder explicação' : 'Entenda o tema'}
        </button>
        {#if mostrarContexto}
          <p class="mt-2 rounded-lg bg-slate-100 p-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">{atual.contexto}</p>
        {/if}
      </div>
    {/if}

    <div class="grid grid-cols-5 gap-2 sm:gap-3" role="group" aria-label="Sua resposta">
      {#each ESCALA as op, i (op.valor)}
        {@const selecionado = respostaAtual === op.valor}
        <button
          type="button"
          class="group flex flex-col items-center gap-2 rounded-xl border px-1 py-3 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:px-2 sm:py-4 dark:focus-visible:outline-white {selecionado
            ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900 dark:border-slate-100 dark:bg-slate-900 dark:ring-slate-100'
            : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-600 dark:hover:bg-slate-900'}"
          aria-pressed={selecionado}
          aria-keyshortcuts={String(i + 1)}
          onclick={() => responder(op.valor)}
        >
          <span class="grid size-10 place-items-center rounded-full transition group-hover:scale-105 sm:size-12 {op.cor}">
            <Icone nome={op.icone} classe="size-5 sm:size-6" />
          </span>
          <span class="text-xs leading-tight font-medium text-slate-700 sm:text-sm dark:text-slate-300">{op.texto}</span>
        </button>
      {/each}
    </div>

    <div class="flex items-center justify-between text-sm">
      <button
        type="button"
        class="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 disabled:invisible dark:text-slate-300 dark:hover:bg-slate-900"
        disabled={indice === 0}
        onclick={voltar}
      >
        ← Voltar
      </button>
      <button
        type="button"
        class="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900 {respostaAtual === null
          ? 'underline underline-offset-4'
          : ''}"
        onclick={() => responder(null)}
      >
        Pular (não tenho opinião)
      </button>
    </div>

    {#if indice > 0 || Object.keys(respostas).length > 0}
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-200 pt-4 text-sm dark:border-slate-800">
        {#if confirmarRecomeco}
          <span class="text-slate-700 dark:text-slate-300">Apagar suas respostas e começar de novo?</span>
          <button
            type="button"
            class="rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white dark:bg-white dark:text-slate-900"
            onclick={recomecar}
          >
            Sim, recomeçar
          </button>
          <button
            type="button"
            class="rounded-lg px-3 py-1.5 font-medium text-slate-700 ring-1 ring-slate-300 dark:text-slate-300 dark:ring-slate-700"
            onclick={() => (confirmarRecomeco = false)}
          >
            Cancelar
          </button>
        {:else}
          <button
            type="button"
            class="font-medium text-slate-600 underline underline-offset-4 dark:text-slate-400"
            onclick={() => (confirmarRecomeco = true)}
          >
            Recomeçar do início
          </button>
        {/if}
      </div>
    {/if}
  </div>
{:else}
  <p class="text-slate-600 dark:text-slate-400">Carregando…</p>
{/if}
