import { PLANOS, type PlanoId } from './planos';
import type { Pergunta, Resposta } from './schema';

export type Alinhamento = Record<PlanoId, number>;

/** Diferença abaixo da qual o resultado geral é apresentado como empate (3 pontos percentuais). */
export const EMPATE = 0.03;

export interface DetalhePergunta {
  pergunta: Pergunta;
  resposta: Exclude<Resposta, null>;
  concordancia: Alinhamento;
  /** Quanto essa pergunta separou os dois planos para este usuário (0..1). */
  peso: number;
}

export interface Resultado {
  /** Média por pergunta respondida; null se nada foi respondido. */
  geral: Alinhamento | null;
  porTema: Record<string, { alinhamento: Alinhamento; respondidas: number }>;
  detalhes: DetalhePergunta[];
  respondidas: number;
  puladas: number;
}

/** 1 quando a resposta coincide com a posição do plano, 0 quando está no extremo oposto. */
export const concordancia = (resposta: number, posicao: number) => 1 - Math.abs(resposta - posicao) / 4;

/**
 * Concordância máxima com os dois planos para a pergunta entrar em "Onde nenhum plano ficou perto de você":
 * 0.5 = a resposta fica a duas ou mais posições da escala de cada um dos planos.
 */
export const LONGE = 0.5;

/** A resposta ficou longe dos dois planos (ex.: neutro com os planos nos extremos). */
export const longeDosDois = (d: Pick<DetalhePergunta, 'concordancia'>) =>
  Math.max(...PLANOS.map((p) => d.concordancia[p])) <= LONGE;

const media = (valores: Alinhamento[]): Alinhamento =>
  Object.fromEntries(
    PLANOS.map((p) => [p, valores.reduce((soma, v) => soma + v[p], 0) / valores.length]),
  ) as Alinhamento;

export function calcular(perguntas: Pergunta[], respostas: Record<string, Resposta>): Resultado {
  const detalhes: DetalhePergunta[] = [];
  let puladas = 0;

  for (const pergunta of perguntas) {
    const resposta = respostas[pergunta.id];
    if (resposta === null || resposta === undefined) {
      puladas++;
      continue;
    }
    const c = Object.fromEntries(
      PLANOS.map((p) => [p, concordancia(resposta, pergunta.posicoes[p].valor)]),
    ) as Alinhamento;
    detalhes.push({ pergunta, resposta, concordancia: c, peso: Math.abs(c.lula - c.flavio) });
  }

  const porTema: Resultado['porTema'] = {};
  // Sem Map.groupBy/toSorted: o site precisa rodar em celulares com navegadores mais antigos.
  const agrupado = new Map<string, DetalhePergunta[]>();
  for (const d of detalhes) agrupado.set(d.pergunta.tema, [...(agrupado.get(d.pergunta.tema) ?? []), d]);
  for (const [tema, itens] of agrupado) {
    porTema[tema] = { alinhamento: media(itens.map((d) => d.concordancia)), respondidas: itens.length };
  }

  return {
    geral: detalhes.length ? media(detalhes.map((d) => d.concordancia)) : null,
    porTema,
    detalhes: [...detalhes].sort((a, b) => b.peso - a.peso),
    respondidas: detalhes.length,
    puladas,
  };
}
