<script lang="ts">
  import { onMount } from 'svelte';
  import { CHAVE_RESULTADO, decodificar } from '../lib/encode';
  import { NOME_PLANO, POSICAO_PLANO, opcao, pct } from '../lib/rotulos';
  import { PLANOS, type PlanoId } from '../lib/planos';
  import type { Informativo, Pergunta, Plano, Tema } from '../lib/schema';
  import { EMPATE, calcular, longeDosDois, type Resultado } from '../lib/score';
  import CartaoAfirmacao from './CartaoAfirmacao.svelte';
  import SecoesInformativas from './SecoesInformativas.svelte';

  let {
    perguntas,
    temas,
    informativo,
    planos,
    base,
  }: {
    perguntas: Pergunta[];
    temas: Tema[];
    informativo: Informativo;
    planos: Record<PlanoId, Plano>;
    base: string;
  } = $props();

  const nomeTema = new Map(temas.map((t) => [t.id, t.nome]));

  let resultado = $state<Resultado | null>(null);
  let invalido = $state(false);
  let copiado = $state(false);
  let codigoAtual = '';

  // Ordem: link compartilhado (#r=) > resultado de quem acabou de responder nesta aba.
  function lerCodigo() {
    const daUrl = new URLSearchParams(location.hash.slice(1)).get('r');
    if (daUrl) return daUrl;
    try {
      return sessionStorage.getItem(CHAVE_RESULTADO) ?? '';
    } catch {
      return '';
    }
  }

  function carregar() {
    codigoAtual = lerCodigo();
    const respostas = decodificar(perguntas, codigoAtual);
    invalido = !respostas;
    resultado = respostas ? calcular(perguntas, respostas) : null;
  }

  // Só um "#r=" novo troca o resultado; outros "#" (âncoras da própria página) não.
  function aoMudarHash() {
    if (new URLSearchParams(location.hash.slice(1)).has('r')) carregar();
  }

  onMount(() => {
    carregar();
    addEventListener('hashchange', aoMudarHash);
    return () => removeEventListener('hashchange', aoMudarHash);
  });

  // Rola até o cartão sem trocar o "#" da URL, que num link compartilhado guarda as respostas.
  // A suavidade vem do CSS (scroll-behavior), que respeita quem pediu menos animação.
  function irPara(evento: MouseEvent, id: string) {
    const alvo = document.getElementById(id);
    if (!alvo) return;
    evento.preventDefault();
    alvo.scrollIntoView();
  }

  const manchete = $derived.by(() => {
    const g = resultado?.geral;
    if (!g) return '';
    if (Math.abs(g.lula - g.flavio) < EMPATE) return 'Suas respostas ficaram praticamente empatadas entre os dois planos.';
    const maisProximo = g.lula > g.flavio ? 'lula' : 'flavio';
    return `Suas respostas estão mais próximas do plano de ${NOME_PLANO[maisProximo].nome}.`;
  });

  const resumoRespostas = $derived.by(() => {
    if (!resultado) return '';
    const { respondidas: r, puladas: p } = resultado;
    const texto = `${r} ${r === 1 ? 'afirmação respondida' : 'afirmações respondidas'}`;
    return p ? `${texto} (${p} ${p === 1 ? 'pulada' : 'puladas'})` : texto;
  });

  // Na ordem do questionário (por tema), não na ordem de "Por quê".
  const longeDeAmbos = $derived(
    resultado ? temas.flatMap((t) => resultado!.detalhes.filter((d) => d.pergunta.tema === t.id && longeDosDois(d))) : [],
  );
  const temasComPergunta = $derived(temas.filter((t) => resultado?.porTema[t.id]));
  const temasSemPergunta = $derived(temas.filter((t) => !perguntas.some((p) => p.tema === t.id)));

  async function compartilhar() {
    const url = `${location.origin}${base}resultado/#r=${codigoAtual}`;
    try {
      if (navigator.share) return await navigator.share({ title: 'Meu resultado no Confere o Plano', url });
      await navigator.clipboard.writeText(url);
      copiado = true;
      setTimeout(() => (copiado = false), 2500);
    } catch {}
  }
</script>

{#snippet barra(plano: PlanoId, valor: number, grande = false)}
  <div class="flex items-center gap-3">
    <span class="w-32 shrink-0 text-sm font-medium sm:w-40 {NOME_PLANO[plano].cor}">
      {NOME_PLANO[plano].nome} <span class="font-normal text-slate-500 dark:text-slate-400">({NOME_PLANO[plano].partido})</span>
    </span>
    <div class="h-3 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 {grande ? 'h-4' : ''}">
      <div class="h-full rounded-full {NOME_PLANO[plano].barra}" style="width: {valor * 100}%"></div>
    </div>
    <span class="w-12 text-right font-semibold tabular-nums {grande ? 'text-lg' : 'text-sm'}">{pct(valor)}</span>
  </div>
{/snippet}

{#if invalido}
  <div class="flex flex-col gap-4">
    <h1 class="text-2xl font-semibold">Resultado não encontrado</h1>
    <p class="text-slate-700 dark:text-slate-300">
      O resultado fica guardado só na aba do navegador em que você respondeu. Se você abriu um link compartilhado, ele
      está incompleto ou é de uma versão anterior das perguntas.
    </p>
    <a class="self-start rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white dark:bg-white dark:text-slate-900" href="{base}quiz/">
      Responder o questionário
    </a>
  </div>
{:else if resultado && !resultado.geral}
  <div class="flex flex-col gap-4">
    <h1 class="text-2xl font-semibold">Nenhuma afirmação respondida</h1>
    <p class="text-slate-700 dark:text-slate-300">Você pulou todas as afirmações, então não há como calcular o alinhamento.</p>
    <a class="self-start rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white dark:bg-white dark:text-slate-900" href="{base}quiz/">
      Tentar de novo
    </a>
  </div>
{:else if resultado?.geral}
  {@const geral = resultado.geral}
  <div class="flex flex-col gap-12">
    <section class="flex flex-col gap-5">
      <div class="flex flex-col gap-2">
        <h1 class="text-3xl font-semibold text-balance">{manchete}</h1>
        <p class="text-sm text-slate-600 dark:text-slate-400">
          Isto não é uma recomendação de voto. O resultado mede o quanto suas respostas concordam com o que cada plano diz
          em {perguntas.length} afirmações, não a qualidade dos planos nem dos candidatos.
          <a class="font-medium text-slate-900 underline underline-offset-4 dark:text-slate-100" href="{base}sobre/">Como funciona</a>
        </p>
      </div>
      <div class="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        {#each PLANOS as p (p)}
          {@render barra(p, geral[p], true)}
        {/each}
        <p class="text-xs text-slate-600 dark:text-slate-400">
          Concordância média com cada plano em {resumoRespostas}. Os percentuais são independentes e não somam 100%.
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white dark:bg-white dark:text-slate-900"
          onclick={compartilhar}
        >
          {copiado ? 'Link copiado!' : 'Compartilhar resultado'}
        </button>
        <a class="rounded-lg px-4 py-2 font-semibold text-slate-800 ring-1 ring-slate-300 dark:text-slate-200 dark:ring-slate-700" href="{base}quiz/">
          Refazer
        </a>
      </div>
      <p class="text-xs text-slate-600 dark:text-slate-400">
        O link compartilhado contém as suas respostas: quem abrir verá como você respondeu cada afirmação.
      </p>
    </section>

    <section class="flex flex-col gap-4">
      <h2 class="text-xl font-semibold">Por tema</h2>
      {#each temasComPergunta as t (t.id)}
        {@const dados = resultado.porTema[t.id]}
        <div class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold">
            {t.nome}
            <span class="font-normal text-slate-500 dark:text-slate-400">· {dados.respondidas} {dados.respondidas === 1 ? 'afirmação' : 'afirmações'}</span>
          </h3>
          {#each PLANOS as p (p)}
            {@render barra(p, dados.alinhamento[p])}
          {/each}
        </div>
      {/each}
      {#if temasSemPergunta.length}
        <p class="text-sm text-slate-600 dark:text-slate-400">
          Sem afirmações que pontuam: {temasSemPergunta.map((t) => t.nome).join('; ')}. Nesses temas os planos tratam de
          assuntos diferentes; veja abaixo o que cada um propõe.
        </p>
      {/if}
    </section>

    {#if longeDeAmbos.length}
      <section class="flex flex-col gap-4">
        <div>
          <h2 class="text-xl font-semibold">Onde nenhum plano ficou perto de você</h2>
          <p class="text-sm text-slate-600 dark:text-slate-400">
            Afirmações em que a sua resposta ficou a duas posições ou mais da escala de distância dos dois planos. Por
            exemplo: você ficou neutro e os planos, em lados opostos.
          </p>
        </div>
        <ul class="flex flex-col gap-3">
          {#each longeDeAmbos as d (d.pergunta.id)}
            <li class="flex flex-col gap-1.5 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <a
                class="text-sm font-semibold underline-offset-4 hover:underline"
                href="#{d.pergunta.id}"
                onclick={(e) => irPara(e, d.pergunta.id)}
              >
                {d.pergunta.afirmacao}
              </a>
              <p class="text-xs text-slate-600 dark:text-slate-400">
                Você: <strong class="font-semibold text-slate-900 dark:text-slate-100">{opcao(d.resposta).texto}</strong>
                {#each PLANOS as p (p)}
                  {' · '}{NOME_PLANO[p].nome}:
                  <strong class="font-semibold text-slate-900 dark:text-slate-100">{POSICAO_PLANO[d.pergunta.posicoes[p].valor]}</strong>
                {/each}
              </p>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section class="flex flex-col gap-4">
      <div>
        <h2 class="text-xl font-semibold">Por quê</h2>
        <p class="text-sm text-slate-600 dark:text-slate-400">
          Cada afirmação que você respondeu, com o que cada plano diz e onde. As primeiras são as que mais separaram os dois
          planos nas suas respostas.
        </p>
      </div>
      {#each resultado.detalhes as d (d.pergunta.id)}
        <CartaoAfirmacao
          pergunta={d.pergunta}
          nomeTema={nomeTema.get(d.pergunta.tema)}
          {planos}
          resposta={d.resposta}
          concordancia={d.concordancia}
        />
      {/each}
    </section>

    <SecoesInformativas {temas} {informativo} {planos} />
  </div>
{:else}
  <p class="text-slate-600 dark:text-slate-400">Carregando…</p>
{/if}
