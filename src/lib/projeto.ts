// Identificação do projeto. A Lei 9.504/97, art. 57-D, veda o anonimato na manifestação pela internet
// durante a campanha, por isso o responsável aparece na página "Sobre".
export const REPOSITORIO = 'https://github.com/FilipeJohansson/confere-o-plano';

export const RESPONSAVEL = {
  /** Nome exibido na página "Sobre". Enquanto for null, aparece só o usuário do GitHub. */
  nome: null as string | null,
  github: 'FilipeJohansson',
};

/** Link para abrir uma issue de correção, já com a afirmação preenchida quando houver. */
export function urlCorrecao(pergunta?: { id: string; afirmacao: string }) {
  const params = new URLSearchParams({ template: 'correcao.yml' });
  if (pergunta) {
    params.set('title', `Correção: ${pergunta.afirmacao.slice(0, 60)}…`);
    params.set('pergunta', pergunta.id);
  }
  return `${REPOSITORIO}/issues/new?${params}`;
}
