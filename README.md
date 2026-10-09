# Confere o Plano

confereoplano.com.br


Site estático que compara as respostas do usuário com os **planos de governo** registrados no TSE pelos candidatos ao 2º turno da eleição presidencial de 2026 (Lula/PT e Flávio Bolsonaro/PL), mostrando com qual plano há mais alinhamento e **por quê**, com citação literal e link para a página exata de cada PDF.

## Estado atual

Conteúdo (16 perguntas + informativo) e MVP do site prontos: quiz, cálculo e resultado com citações.

## Desenvolvimento

```sh
pnpm install
pnpm dev           # servidor local
pnpm validar       # confere cada citação contra o texto da página do PDF
pnpm test          # testes do cálculo e da codificação da URL
pnpm build         # validar + build estático em dist/
pnpm e2e           # testes no navegador, sobre o build servido pelo wrangler dev (use PW_CHROMIUM=/caminho/do/chromium se não tiver os navegadores do Playwright)
pnpm imagem        # regera public/compartilhar.png, a imagem da prévia do link (WhatsApp, redes)
```

## Publicação (Cloudflare Pages)

O site é publicado no Cloudflare Pages, ligado ao repositório do GitHub (configuração em `wrangler.jsonc`, que aponta
para a pasta `dist/`). No painel do Pages:

| Campo | Valor |
|---|---|
| Production branch | `main` |
| Framework preset | `Astro` (ou nenhum) |
| Build command | `pnpm run build` |
| Build output directory | `dist` |
| Variáveis de ambiente | `NODE_VERSION = 22` e `PNPM_VERSION = 10.28.0` |

Cada branch que não é a `main` ganha uma prévia automática em `<branch>.confere-o-plano.pages.dev` (o Pages troca `/`
por `-` no nome da branch). O GoatCounter não conta visitas nas prévias (`HOSTS_CONTADOS` em `src/lib/contagem.ts`).

O Pages aplica os cabeçalhos de segurança de `public/_headers` (CSP: só scripts do site e do GoatCounter; o site não
pode ser embutido em outra página), serve `dist/404.html` para endereços inexistentes e redireciona `/quiz` para
`/quiz/`. Para conferir localmente: `pnpm build && pnpm exec wrangler pages dev`. Os testes e2e usam esse mesmo
servidor.

`e2e/acessibilidade.spec.ts` roda o axe-core (WCAG 2.1 A e AA) em todas as páginas, nos temas claro e escuro.

`e2e/aleatorio.spec.ts` responde o questionário 10 vezes (por tamanho de tela) com escolhas aleatórias e falha se a
página registrar qualquer erro ou se o resultado não bater com as respostas. A falha traz o log das escolhas em ordem
e a semente; para repetir exatamente a mesma execução: `SEED=<semente base> pnpm exec playwright test e2e/aleatorio.spec.ts -g "#<n>"`.

Estrutura: `data/` (planos, temas, perguntas, informativo, texto das páginas), `src/lib/` (schema, cálculo,
codificação da URL), `src/components/` (Quiz, Resultado), `src/pages/` (início, quiz, resultado, todas as afirmações,
sobre e metodologia).

- [`data/perguntas.yaml`](data/perguntas.yaml): as afirmações, a posição de cada plano e as citações
- [`data/planos.yaml`](data/planos.yaml): metadados e SHA-256 dos PDFs usados
- `data/fontes/{pt,pl}/p-NNN.txt`: texto extraído por página (base para validar citações)
- `data/pdf/*.pdf`: cópia dos PDFs oficiais do TSE, guardada como prova da versão usada (não é publicada no site; as citações apontam para o TSE)

## Fontes

- Lula (PT): https://www.tse.jus.br/eleicoes/eleicoes-2026-content/propostas-de-governo-dos-candidatos-ao-cargo-de-presidente-da-republica-eleicoes-2026/lula-propostas-de-governo
- Flávio Bolsonaro (PL): https://www.tse.jus.br/eleicoes/eleicoes-2026-content/propostas-de-governo-dos-candidatos-ao-cargo-de-presidente-da-republica-eleicoes-2026/flavio-bolsonaro

## Licença

Todos os direitos reservados. O repositório é público para que o conteúdo possa ser conferido; citar trechos com a
fonte é permitido, mas copiar, redistribuir ou criar versões derivadas exige autorização. Veja [LICENSE](LICENSE).
