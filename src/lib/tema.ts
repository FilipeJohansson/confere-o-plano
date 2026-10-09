/** Chave do localStorage com o tema escolhido ("dark" ou "light"). Sem escolha, o site fica claro. */
export const CHAVE_TEMA = 'confereoplano:tema';

/**
 * Script para o <head>: aplica o tema salvo antes da página aparecer, para não piscar claro antes do escuro.
 * Fica como texto porque precisa rodar inline, antes de qualquer outro script.
 */
export const SCRIPT_TEMA = `try{if(localStorage.getItem(${JSON.stringify(CHAVE_TEMA)})==='dark')document.documentElement.dataset.theme='dark'}catch(e){}`;
