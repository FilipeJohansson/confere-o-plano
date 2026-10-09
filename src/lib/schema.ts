import { z } from 'zod';

import { PLANOS } from './planos';

export { PLANOS, type PlanoId } from './planos';

const valor = z.number().int().min(-2).max(2);

const citacao = z.object({
  pagina: z.number().int().positive(),
  trecho: z.string().min(1),
});

const posicao = z.object({
  valor,
  resumo: z.string().min(1),
  inferencia: z.string().optional(),
  citacoes: z.array(citacao).min(1),
});

export const temaSchema = z.object({ id: z.string(), nome: z.string() });

export const perguntaSchema = z.object({
  id: z.string(),
  tema: z.string(),
  nivel: z.enum(['A', 'B+']),
  afirmacao: z.string(),
  contexto: z.string().optional(),
  posicoes: z.object({ lula: posicao, flavio: posicao }),
});

export const planoSchema = z.object({
  partido: z.string(),
  arquivo: z.string(),
  url: z.string().url(),
  pagina_tse: z.string().url(),
  paginas: z.number().int(),
  sha256: z.string(),
  /** Data em que a versão usada do PDF foi obtida (AAAA-MM-DD). */
  consultado_em: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const itemComparado = z.object({
  id: z.string(),
  tema: z.string(),
  assunto: z.string(),
  nota: z.string().optional(),
  lula: z.array(citacao).min(1),
  flavio: z.array(citacao).min(1),
});

export const informativoSchema = z.object({
  so_um_lado: z.array(
    z.object({
      id: z.string(),
      tema: z.string(),
      plano: z.enum(PLANOS),
      assunto: z.string(),
      citacoes: z.array(citacao).min(1),
    }),
  ),
  consenso: z.array(itemComparado),
  lado_a_lado: z.array(itemComparado),
});

export type Citacao = z.infer<typeof citacao>;
export type Tema = z.infer<typeof temaSchema>;
export type Pergunta = z.infer<typeof perguntaSchema>;
export type Plano = z.infer<typeof planoSchema>;
export type Informativo = z.infer<typeof informativoSchema>;

/** Resposta do usuário: -2..+2, ou null quando pulou. */
export type Resposta = -2 | -1 | 0 | 1 | 2 | null;
