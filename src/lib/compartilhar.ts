import { NOME_PLANO, pct } from './rotulos';
import { EMPATE, type Alinhamento } from './score';

/**
 * Mensagem que acompanha o link ao compartilhar o resultado. Fica em primeira pessoa porque é a pessoa falando
 * do próprio resultado (ela vê e pode editar antes de enviar); é montada no navegador e não passa por servidor.
 */
export function textoCompartilhar(geral: Alinhamento): string {
  const { flavio, lula } = geral;
  const resultado =
    Math.abs(lula - flavio) < EMPATE
      ? `minhas respostas ficaram praticamente empatadas entre os planos de ${NOME_PLANO.flavio.nome} (${pct(flavio)}) e de ${NOME_PLANO.lula.nome} (${pct(lula)})`
      : (() => {
          const [mais, menos] = lula > flavio ? (['lula', 'flavio'] as const) : (['flavio', 'lula'] as const);
          return `minhas respostas ficaram mais próximas do plano de ${NOME_PLANO[mais].nome} (${pct(geral[mais])}) do que do de ${NOME_PLANO[menos].nome} (${pct(geral[menos])})`;
        })();
  return (
    `Fiz o Confere o Plano: ${resultado}. ` +
    'Cada resposta vem com o trecho e a página dos planos registrados no TSE. Com qual você concorda mais?'
  );
}
