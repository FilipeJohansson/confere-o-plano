import { describe, expect, it } from 'vitest';
import { codificar, decodificar } from './encode';
import type { Pergunta, Resposta } from './schema';
import { calcular, concordancia, longeDosDois } from './score';

function pergunta(id: string, tema: string, lula: number, flavio: number): Pergunta {
  const pos = (valor: number) => ({ valor, resumo: '-', citacoes: [{ pagina: 1, trecho: '-' }] });
  return { id, tema, nivel: 'A', afirmacao: id, posicoes: { lula: pos(lula), flavio: pos(flavio) } };
}

const perguntas = [
  pergunta('a', 'economia', 2, -2),
  pergunta('b', 'economia', -2, 2),
  pergunta('c', 'governanca', 0, 2),
];

describe('concordancia', () => {
  it('vai de 1 (igual) a 0 (extremos opostos)', () => {
    expect(concordancia(2, 2)).toBe(1);
    expect(concordancia(-2, 2)).toBe(0);
    expect(concordancia(0, 2)).toBe(0.5);
  });
});

describe('calcular', () => {
  it('sem respostas não tem resultado geral', () => {
    const r = calcular(perguntas, {});
    expect(r.geral).toBeNull();
    expect(r.puladas).toBe(3);
  });

  it('concordar com tudo que um plano diz dá 100% para ele', () => {
    const r = calcular(perguntas, { a: 2, b: -2, c: 0 });
    expect(r.geral?.lula).toBe(1);
    expect(r.geral?.flavio).toBeCloseTo((0 + 0 + 0.5) / 3);
  });

  it('os percentuais dos dois planos são independentes (não somam 100%)', () => {
    const r = calcular(perguntas, { a: 0, b: 0, c: 1 });
    expect(r.geral!.lula + r.geral!.flavio).not.toBe(1);
  });

  it('ignora perguntas puladas no cálculo', () => {
    const r = calcular(perguntas, { a: 2, b: null, c: null });
    expect(r.respondidas).toBe(1);
    expect(r.puladas).toBe(2);
    expect(r.geral).toEqual({ lula: 1, flavio: 0 });
  });

  it('agrupa por tema e ordena os detalhes pela diferença entre os planos', () => {
    const r = calcular(perguntas, { a: 2, b: 0, c: 1 });
    expect(r.porTema.economia.respondidas).toBe(2);
    expect(r.porTema.governanca.respondidas).toBe(1);
    expect(r.detalhes[0].pergunta.id).toBe('a');
    expect(r.detalhes.at(-1)!.peso).toBe(0);
  });
});

describe('longeDosDois', () => {
  it('marca a resposta a duas ou mais posições dos dois planos', () => {
    // Planos nos extremos (2 e -2): só o neutro fica longe dos dois.
    const extremos = (r: number) => longeDosDois(calcular([pergunta('x', 'economia', 2, -2)], { x: r as Resposta }).detalhes[0]);
    expect([-2, -1, 0, 1, 2].filter(extremos)).toEqual([0]);
    // Um plano concorda totalmente, o outro é neutro: só "discordo totalmente" fica longe dos dois.
    const umNeutro = (r: number) => longeDosDois(calcular([pergunta('x', 'economia', 2, 0)], { x: r as Resposta }).detalhes[0]);
    expect([-2, -1, 0, 1, 2].filter(umNeutro)).toEqual([-2]);
  });
});

describe('codificar/decodificar', () => {
  it('ida e volta preserva as respostas, inclusive puladas', () => {
    const respostas: Record<string, Resposta> = { a: -2, b: null, c: 2 };
    const codigo = codificar(perguntas, respostas);
    expect(codigo).toBe('v1.0_4');
    expect(decodificar(perguntas, codigo)).toEqual(respostas);
  });

  it('rejeita código de outra versão ou com tamanho errado', () => {
    expect(decodificar(perguntas, 'v0.000')).toBeNull();
    expect(decodificar(perguntas, 'v1.00')).toBeNull();
    expect(decodificar(perguntas, 'v1.0x4')).toBeNull();
    expect(decodificar(perguntas, 'lixo')).toBeNull();
  });
});
