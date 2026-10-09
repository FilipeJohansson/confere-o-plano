// Carrega e valida os arquivos de data/ no momento do build (roda só no servidor).
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { z } from 'zod';
import { informativoSchema, perguntaSchema, planoSchema, temaSchema, type PlanoId } from './schema';

const ler = (arquivo: string) => parse(readFileSync(new URL(`../../data/${arquivo}`, import.meta.url), 'utf8'));

export const temas = z.array(temaSchema).parse(ler('temas.yaml'));
export const perguntas = z.array(perguntaSchema).parse(ler('perguntas.yaml'));
export const informativo = informativoSchema.parse(ler('informativo.yaml'));
export const planos = z.record(z.enum(['lula', 'flavio']), planoSchema).parse(ler('planos.yaml')) as Record<
  PlanoId,
  z.infer<typeof planoSchema>
>;
