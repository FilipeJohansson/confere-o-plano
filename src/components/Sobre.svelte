<script lang="ts">
  // Conteúdo da página "Sobre e metodologia", usado pelo site (src/pages/sobre/) e pela prévia.
  import { GOATCOUNTER } from '../lib/contagem';
  import { PLANOS, type PlanoId } from '../lib/planos';
  import { REPOSITORIO, RESPONSAVEL, urlCorrecao } from '../lib/projeto';
  import { NOME_PLANO } from '../lib/rotulos';
  import type { Informativo, Pergunta, Plano, Tema } from '../lib/schema';
  import { EMPATE } from '../lib/score';

  let {
    perguntas,
    temas,
    informativo,
    planos,
    base,
  }: { perguntas: Pergunta[]; temas: Tema[]; informativo: Informativo; planos: Record<PlanoId, Plano>; base: string } =
    $props();

  const dataBR = (iso: string) => iso.split('-').reverse().join('/');
  const inferidas = perguntas.filter((p) => p.nivel === 'B+').length;
  // Em quantas afirmações "concordo" aproxima de cada plano (equilíbrio de redação).
  const aproxima = PLANOS.map((pl) => ({
    nome: NOME_PLANO[pl].nome,
    n: perguntas.filter((q) => q.posicoes[pl].valor > q.posicoes[pl === 'lula' ? 'flavio' : 'lula'].valor).length,
  }));
  const temasSemAfirmacao = temas.filter((t) => !perguntas.some((p) => p.tema === t.id));
  const quem = RESPONSAVEL.nome ?? `@${RESPONSAVEL.github}`;
</script>

<article class="mx-auto flex max-w-3xl flex-col gap-6 [&_a]:underline [&_a]:underline-offset-4 [&_h2]:text-xl [&_h2]:font-bold [&_p]:text-slate-700 dark:[&_p]:text-slate-300">
  <header class="flex flex-col gap-3">
    <h1 class="text-3xl font-bold tracking-tight text-balance sm:text-4xl">Sobre e metodologia</h1>
    <p>
      O Confere o Plano compara as suas respostas com o que está escrito nos planos de governo que os candidatos do 2º
      turno da eleição presidencial de 2026 registraram no TSE. Cada resultado vem com o trecho e a página do plano que o
      justificam.
    </p>
  </header>

  <section class="cartao flex flex-col gap-3 p-5 sm:p-7">
    <h2>Quem faz</h2>
    <p>
      É um projeto independente e sem fins lucrativos, mantido por uma pessoa física:
      <a href="https://github.com/{RESPONSAVEL.github}" target="_blank" rel="noopener">{quem}</a>. Não tem vínculo,
      patrocínio nem endosso do TSE, de candidatos, partidos ou campanhas. Não é página oficial de nenhum deles.
    </p>
  </section>

  <section class="cartao flex flex-col gap-3 p-5 sm:p-7">
    <h2>Fontes</h2>
    <p>
      Os únicos documentos usados são as propostas de governo publicadas pelo TSE. Os links das citações levam à página
      exata do PDF oficial. A versão usada de cada arquivo é identificada pelo hash SHA-256, para que qualquer pessoa
      confira se é o mesmo documento.
    </p>
    <ul class="flex flex-col gap-3">
      {#each PLANOS as p (p)}
          <li class="rounded-xl bg-slate-50 p-3 text-sm ring-1 ring-slate-200 ring-inset dark:bg-slate-950 dark:ring-slate-800">
            <p class="font-semibold text-slate-900 dark:text-slate-100">
              {NOME_PLANO[p].nome} ({NOME_PLANO[p].partido})
            </p>
            <p>
              <a href={planos[p].pagina_tse} target="_blank" rel="noopener">
                Página no TSE
              </a> 
              · 
              <a href={planos[p].url} target="_blank" rel="noopener">
                PDF ({planos[p].paginas} páginas)
              </a> 
              · consultado em {dataBR(planos[p].consultado_em)}
            </p>
            <p class="font-mono text-xs break-all">SHA-256: {planos[p].sha256}</p>
          </li>
      {/each}
    </ul>
  </section>

  <section class="cartao flex flex-col gap-3 p-5 sm:p-7">
    <h2>Como as afirmações foram escolhidas</h2>
    <p>
      Os dois planos foram lidos por inteiro e organizados nas 8 categorias que o próprio TSE usa para indexá-los. Uma
      afirmação só entra quando os dois planos falam do mesmo assunto e têm posições diferentes. Por isso são
      {perguntas.length} afirmações. Para evitar que concordar com tudo favoreça um lado, a redação é equilibrada: em
      {aproxima.map((a) => `${a.n} delas "concordo" aproxima do plano de ${a.nome}`).join(' e em ')}.
    </p>
    <p>
      A posição de cada plano vai de "discorda totalmente" a "concorda totalmente" e é sempre acompanhada do trecho
      literal que a justifica. Em {inferidas} afirmações, um dos planos não trata do ponto exatamente, e a posição foi inferida
      de um trecho próximo. Nesses casos o resultado mostra o aviso "Posição inferida" e explica o raciocínio.
    </p>
    <p>
      Um programa confere, a cada atualização do site, que todo trecho citado aparece literalmente na página indicada do
      PDF.
    </p>
    {#if temasSemAfirmacao.length > 0}
        <p>
          Em {temasSemAfirmacao.map((t) => t.nome).join('; ')}, os planos tratam de assuntos diferentes e não há
          afirmação que permita comparar os dois. Esses temas aparecem no resultado só de forma informativa.
        </p>
    {/if}
    <p>
      O resultado também mostra, sem pontuar, {informativo.so_um_lado.length} propostas que aparecem em apenas um dos
      planos, {informativo.consenso.length} pontos em que os dois concordam e temas sensíveis em que comparar exigiria
      interpretar o texto, apresentados lado a lado.
    </p>
  </section>

  <section class="cartao flex flex-col gap-3 p-5 sm:p-7">
    <h2>Como o resultado é calculado</h2>
    <p>
      Para cada afirmação respondida, a concordância com um plano é 100% quando a sua resposta é igual à posição do plano
      e 0% quando está no extremo oposto da escala. Cada passo de distância na escala de 5 pontos tira 25%. Afirmações
      puladas não entram na conta.
    </p>
    <p>
      O percentual de cada plano é a média dessas concordâncias. Os dois percentuais são calculados separadamente e não
      somam 100%. Quando a diferença entre eles é menor que {EMPATE * 100} pontos, o resultado é apresentado como empate.
      As barras por tema usam a mesma conta, só com as afirmações de cada tema.
    </p>
  </section>

  <section class="cartao flex flex-col gap-3 p-5 sm:p-7">
    <h2>Limitações</h2>
    <p>
      Isto não é uma recomendação de voto. O site compara apenas o texto dos planos registrados no TSE, não o histórico,
      as falas, os votos ou as alianças dos candidatos. As {perguntas.length} afirmações cobrem só uma parte de cada plano,
      e a escolha delas, assim como a posição atribuída a cada plano, é uma interpretação deste projeto. Por isso cada
      posição vem com a citação: confira e tire suas próprias conclusões.
    </p>
  </section>

  <section class="cartao flex flex-col gap-3 p-5 sm:p-7">
    <h2>Privacidade</h2>
    <p>
      Suas respostas nunca saem do seu navegador: o cálculo é feito no seu aparelho e nada é enviado a servidores. O
      resultado fica guardado só na aba em que você respondeu. Se você usar "Compartilhar resultado", o link gerado
      contém as suas respostas, e quem abrir verá como você respondeu.
    </p>
    <p>
      Contamos visitas às páginas com o <a href="https://www.goatcounter.com" target="_blank" rel="noopener">GoatCounter</a>,
      que não usa cookies e não identifica o visitante. Ele recebe apenas qual página foi aberta (por exemplo, "resultado"),
      o site de origem, o navegador e o tamanho da tela, nunca as respostas. Os números são
      <a href="https://{GOATCOUNTER}.goatcounter.com" target="_blank" rel="noopener">públicos</a>. Não divulgamos
      nenhuma estatística sobre os resultados das pessoas.
    </p>
  </section>

  <section class="cartao flex flex-col gap-3 p-5 sm:p-7">
    <h2>Correções</h2>
    <p>
      Achou uma citação que não confere, uma posição atribuída de forma errada ou uma afirmação mal formulada?
      <a href={urlCorrecao()} target="_blank" rel="noopener">Abra um pedido de correção</a> (precisa de uma conta no
      GitHub). Cada cartão do resultado também tem um link para avisar sobre aquela afirmação.
    </p>
    <p>
      Todo o conteúdo e o código estão no <a href={REPOSITORIO} target="_blank" rel="noopener">repositório do projeto</a>,
      incluindo as afirmações, as posições e as citações. Ele é público para que qualquer pessoa possa conferir, mas
      todos os direitos são reservados: citar trechos com a fonte é permitido; copiar ou fazer versões derivadas, só
      com autorização (<a href="{REPOSITORIO}/blob/main/LICENSE" target="_blank" rel="noopener">termos completos</a>).
    </p>
  </section>

  <p>
    <a href="{base}quiz/" class="botao-primario no-underline!">Responder o questionário</a>
  </p>
</article>
