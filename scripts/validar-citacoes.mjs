// Confere se cada citação dos arquivos de dados existe literalmente na página indicada do PDF
// (usando o texto extraído em data/fontes/{pt,pl}/p-NNN.txt), se os PDFs guardados são a versão
// registrada (SHA-256) e valida a estrutura das perguntas. Sai com código 1 se encontrar qualquer erro.
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { parse } from 'yaml';

const PASTA_FONTE = { lula: 'data/fontes/pt', flavio: 'data/fontes/pl' };
const PLANOS = Object.keys(PASTA_FONTE);

const ler = (caminho) => parse(readFileSync(caminho, 'utf8'));

// Ignora quebras de linha, espaços, hifenização de layout e variações de aspas/travessões.
const normalizar = (texto) =>
  texto
    .normalize('NFC')
    .toLowerCase()
    .replace(/[“”"]/g, '"')
    .replace(/[‘’']/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, '');

const cachePaginas = new Map();
function textoDaPagina(plano, pagina) {
  const chave = `${plano}:${pagina}`;
  if (!cachePaginas.has(chave)) {
    const caminho = `${PASTA_FONTE[plano]}/p-${String(pagina).padStart(3, '0')}.txt`;
    cachePaginas.set(chave, existsSync(caminho) ? normalizar(readFileSync(caminho, 'utf8')) : null);
  }
  return cachePaginas.get(chave);
}

const erros = [];
let totalCitacoes = 0;

function checarCitacoes(onde, plano, citacoes) {
  if (!Array.isArray(citacoes) || citacoes.length === 0) {
    erros.push(`${onde}: nenhuma citação`);
    return;
  }
  for (const { pagina, trecho } of citacoes) {
    totalCitacoes++;
    const texto = textoDaPagina(plano, pagina);
    if (texto === null) erros.push(`${onde}: página ${pagina} não existe`);
    else if (!texto.includes(normalizar(trecho))) erros.push(`${onde}: trecho não encontrado na p. ${pagina}: "${trecho}"`);
  }
}

const temas = new Set(ler('data/temas.yaml').map((t) => t.id));
const ids = new Set();
function checarId(id, onde) {
  if (!id) erros.push(`${onde}: sem id`);
  else if (ids.has(id)) erros.push(`${onde}: id duplicado`);
  ids.add(id);
}
function checarTema(tema, onde) {
  if (!temas.has(tema)) erros.push(`${onde}: tema desconhecido "${tema}"`);
}

const perguntas = ler('data/perguntas.yaml');
for (const p of perguntas) {
  const onde = `pergunta ${p.id}`;
  checarId(p.id, onde);
  checarTema(p.tema, onde);
  if (!p.afirmacao) erros.push(`${onde}: sem afirmação`);
  if (!['A', 'B+'].includes(p.nivel)) erros.push(`${onde}: nível inválido "${p.nivel}"`);

  for (const plano of PLANOS) {
    const pos = p.posicoes?.[plano];
    if (!pos) {
      erros.push(`${onde}: falta posição de ${plano}`);
      continue;
    }
    if (!Number.isInteger(pos.valor) || pos.valor < -2 || pos.valor > 2) erros.push(`${onde}/${plano}: valor inválido ${pos.valor}`);
    if (!pos.resumo) erros.push(`${onde}/${plano}: sem resumo`);
    checarCitacoes(`${onde}/${plano}`, plano, pos.citacoes);
  }

  const inferidos = PLANOS.filter((pl) => p.posicoes?.[pl]?.inferencia);
  if (p.nivel === 'A' && inferidos.length > 0) erros.push(`${onde}: nível A não deve ter inferência`);
  if (p.nivel === 'B+' && inferidos.length === 0) erros.push(`${onde}: nível B+ precisa explicar a inferência`);
  if (p.posicoes?.lula?.valor === p.posicoes?.flavio?.valor) erros.push(`${onde}: os dois planos têm o mesmo valor; a pergunta não discrimina`);
}

// Os PDFs guardados no repositório são a versão citada: o hash precisa bater com data/planos.yaml.
for (const [plano, meta] of Object.entries(ler('data/planos.yaml'))) {
  if (!existsSync(meta.arquivo)) erros.push(`plano ${plano}: arquivo ${meta.arquivo} não existe`);
  else if (createHash('sha256').update(readFileSync(meta.arquivo)).digest('hex') !== meta.sha256)
    erros.push(`plano ${plano}: SHA-256 de ${meta.arquivo} não confere com data/planos.yaml`);
}

const info = ler('data/informativo.yaml');
for (const item of info.so_um_lado ?? []) {
  const onde = `so_um_lado ${item.id}`;
  checarId(item.id, onde);
  checarTema(item.tema, onde);
  if (!PLANOS.includes(item.plano)) erros.push(`${onde}: plano inválido "${item.plano}"`);
  else checarCitacoes(onde, item.plano, item.citacoes);
}
for (const grupo of ['consenso', 'lado_a_lado']) {
  for (const item of info[grupo] ?? []) {
    const onde = `${grupo} ${item.id}`;
    checarId(item.id, onde);
    checarTema(item.tema, onde);
    for (const plano of PLANOS) checarCitacoes(`${onde}/${plano}`, plano, item[plano]);
  }
}

if (erros.length > 0) {
  console.error(`${erros.length} erro(s):\n- ${erros.join('\n- ')}`);
  process.exit(1);
}

const porTema = {};
for (const p of perguntas) porTema[p.tema] = (porTema[p.tema] ?? 0) + 1;
const polaridade = perguntas.reduce(
  (acc, p) => {
    acc[p.posicoes.lula.valor > p.posicoes.flavio.valor ? 'lula' : 'flavio']++;
    return acc;
  },
  { lula: 0, flavio: 0 },
);
console.log(`OK: ${perguntas.length} perguntas, ${totalCitacoes} citações conferidas.`);
console.log('Perguntas por tema:', porTema);
console.log('"Concordo" aproxima de:', polaridade);
