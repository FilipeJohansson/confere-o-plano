// Separado de schema.ts para que o código do navegador não carregue o zod.
// Ordem alfabética pelo nome do candidato.
export const PLANOS = ['flavio', 'lula'] as const;
export type PlanoId = (typeof PLANOS)[number];
