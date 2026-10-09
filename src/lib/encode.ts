// Codifica as respostas num texto curto para a URL de resultado, ex.: "v1.40_3212...".
// Um caractere por pergunta, na ordem de data/perguntas.yaml: '0'..'4' = -2..+2, '_' = pulou.
// O prefixo de versão permite invalidar links antigos se as perguntas mudarem.
import type { Pergunta, Resposta } from './schema';

const VERSAO = 'v1';

/**
 * Onde o resultado de quem acabou de responder fica guardado (só nesta aba do navegador).
 * As respostas só vão para a URL quando a pessoa escolhe compartilhar o resultado.
 */
export const CHAVE_RESULTADO = 'confereoplano:resultado';

export function codificar(perguntas: Pick<Pergunta, 'id'>[], respostas: Record<string, Resposta>): string {
  const corpo = perguntas
    .map(({ id }) => {
      const r = respostas[id];
      return r === null || r === undefined ? '_' : String(r + 2);
    })
    .join('');
  return `${VERSAO}.${corpo}`;
}

/** Retorna null se o código for de outra versão ou estiver malformado. */
export function decodificar(perguntas: Pick<Pergunta, 'id'>[], codigo: string): Record<string, Resposta> | null {
  const [versao, corpo] = codigo.split('.');
  if (versao !== VERSAO || corpo?.length !== perguntas.length || !/^[0-4_]+$/.test(corpo)) return null;
  return Object.fromEntries(
    perguntas.map(({ id }, i) => [id, corpo[i] === '_' ? null : ((Number(corpo[i]) - 2) as Resposta)]),
  );
}
