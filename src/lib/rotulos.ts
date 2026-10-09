import type { PlanoId } from './planos';

export interface OpcaoEscala {
  valor: -2 | -1 | 0 | 1 | 2;
  texto: string;
  /** Classes de cor do círculo do ícone no questionário e do chip de resposta no resultado. */
  cor: string;
  icone: 'x2' | 'x' | 'menos' | 'check' | 'check2';
}

// Tons suaves (vermelho → cinza → verde) para combinar com o resto do site, que é quase todo neutro.
export const ESCALA: OpcaoEscala[] = [
  { valor: -2, texto: 'Discordo totalmente', cor: 'bg-rose-200 text-rose-900 dark:bg-rose-900/70 dark:text-rose-100', icone: 'x2' },
  { valor: -1, texto: 'Discordo', cor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300', icone: 'x' },
  { valor: 0, texto: 'Neutro', cor: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', icone: 'menos' },
  { valor: 1, texto: 'Concordo', cor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300', icone: 'check' },
  { valor: 2, texto: 'Concordo totalmente', cor: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-100', icone: 'check2' },
];

export const opcao = (valor: number) => ESCALA.find((o) => o.valor === valor)!;

/** Como a posição de um plano aparece no resultado ("O plano concorda totalmente"). */
export const POSICAO_PLANO: Record<number, string> = {
  [-2]: 'Discorda totalmente',
  [-1]: 'Discorda',
  0: 'Neutro',
  1: 'Concorda',
  2: 'Concorda totalmente',
};

// Ordem alfabética pelo nome. Cores escolhidas para não lembrar as cores das campanhas.
export const NOME_PLANO: Record<PlanoId, { nome: string; partido: string; cor: string; barra: string }> = {
  flavio: { nome: 'Flávio Bolsonaro', partido: 'PL', cor: 'text-violet-700 dark:text-violet-300', barra: 'bg-violet-600' },
  lula: { nome: 'Lula', partido: 'PT', cor: 'text-teal-700 dark:text-teal-300', barra: 'bg-teal-600' },
};

export const pct = (x: number) => `${Math.round(x * 100)}%`;
