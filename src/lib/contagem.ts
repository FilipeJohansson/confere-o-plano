// Contagem anônima de acessos com o GoatCounter (painel em https://confereoplano.goatcounter.com).
// Só páginas são contadas: nunca respostas, nunca o "#r=..." da URL do resultado.
export const GOATCOUNTER = 'confereoplano';

/**
 * Marcada pelo quiz ao terminar. Na página de resultado, a visita é contada como
 * "/resultado/concluido" (quem acabou de responder) em vez de "/resultado/" (quem abriu um link compartilhado).
 */
export const CHAVE_CONCLUIU = 'confereoplano:concluiu';

/**
 * Endereços em que o script de contagem é carregado. As prévias da Cloudflare (*.pages.dev) usam o mesmo build
 * de produção e ficam de fora, para não misturar testes com visitas reais. localhost fica para os testes e2e
 * (o GoatCounter de verdade já ignora visitas de localhost).
 */
export const HOSTS_CONTADOS = ['confereoplano.com.br', 'www.confereoplano.com.br', 'localhost', '127.0.0.1'];
