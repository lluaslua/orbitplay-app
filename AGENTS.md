# AGENTS.md

Instruções de trabalho para agentes e pessoas neste repositório. Vale para todo trabalho de código no OrbitPlay. Em conflito com o README, este arquivo ganha; o README descreve o que existe, este arquivo descreve como mexer.

**O idioma do projeto é o pt-BR.** Desenvolvimento e commit em português: código, nome de arquivo, texto de tela, nome de caso de teste, mensagem de commit, PR e documentação. A regra 4 abaixo diz o pouco que fica em inglês.

OrbitPlay é um app desktop (Electron) de playtesting para estúdios de games. O front-end está completo e navegável, com dados mockados em memória. Não existe backend: nenhuma requisição sai da máquina enquanto `VITE_USE_MOCKS=true`.

## Comandos

| Comando | Para quê |
| --- | --- |
| `npm run dev` | Vite em http://localhost:5173 |
| `npm run dev:electron` | Mesma coisa dentro da janela do Electron |
| `npm run typecheck` | Verificação obrigatória antes de entregar |
| `npm test` | Vitest: watch no terminal do dev, uma rodada só em CI ou saída não interativa |
| `npm run build` | Typecheck e bundle de produção |
| `npm run build:win` | Instalador NSIS em `release/` |
| `npm run release` | Sobe versão patch, empacota e publica em `~/OrbitPlayFeed` |

O critério de sucesso verificável é `npm run typecheck` e `npm test` passando, mais a tela afetada aberta no `npm run dev`. Rode de verdade e reporte a saída real, inclusive falha. Nada de "deve funcionar".

## Regras de mudança

1. Menor diff que resolve o pedido. Nada de feature, abstração, configuração ou tratamento de erro que ninguém pediu.
2. Toque só as linhas que o pedido exige. Refatoração de código vizinho só com aviso prévio e ok explícito.
3. Dependência nova entra sem vulnerabilidade conhecida e com justificativa de uma linha do que ela faz que não dá para fazer local. Rode `npm audit` depois de instalar: se a nova entrou com alerta, procure outra ou resolva local. O que já está aqui cobre quase tudo: Radix (primitivas acessíveis), lucide-react (ícones), recharts (gráficos), zustand (estado de sessão), TanStack Query (cache de servidor), react-hook-form com zod (formulários), clsx e tailwind-merge (via `cn` em `utils/helpers`).
4. Tudo em pt-BR: componente, função, variável, nome de arquivo, texto de UI, nome de caso de teste, mensagem de commit e descrição de PR seguem o português do resto do código (`BotoesExportar`, `ComunidadeJogo`, `DetalhesJogo`, `useJanelaDaSessao`). Fica em inglês só o que vem de fora e não é nosso para renomear: API do React e das bibliotecas, props de componente do Radix, chaves de rota e de contrato (`STUDIO`, `PLAYER`, `IN_PROGRESS`), e os campos dos tipos em `types/`, que espelham o backend futuro.
5. Nada carregado ou mantido vivo além do que a tela usa: listener, timer e observer criados têm remoção no cleanup do efeito; `URL.createObjectURL` tem `revokeObjectURL`; dado de tela não fica na store depois que a tela sai.

## Onde colocar cada coisa

```
electron/          processo main, preload e config do electron-builder
src/
  components/UI/     primitivas genéricas (Radix + CVA), reexportadas por index.ts
  components/Common/ compartilhado entre perfis (layout, navbar, cards, gráficos)
  components/Studio/ telas do perfil STUDIO
  components/Player/ telas do perfil PLAYER
  components/Auth/   login
  pages/             uma tela por rota, default export, carregada com lazy
  hooks/             um arquivo por domínio, só TanStack Query
  stores/            Zustand: auth, games, testes
  lib/               axios e queryClient
  mocks/             fixtures, banco em memória, tabela de rotas, MSW e adapter
  types/             contratos que o backend futuro vai cumprir
  utils/             paleta de gráfico, constantes e helpers
```

Import sempre pelo alias `@/`, nunca caminho relativo que sobe de pasta. Primitiva de UI entra por `@/components/UI`.

## Fluxo de dados

Tela chama hook, hook chama os helpers `get`/`post`/`patch`/`del` de `@/lib/api`, o axios cai no adapter mock ou no MSW, os dois leem a mesma tabela `src/mocks/routes.ts`, que fala com o banco em memória `src/mocks/db.ts`.

- Tela nunca chama `axios` nem `fetch` direto.
- Rota nova entra em `mocks/routes.ts` (fonte única dos dois consumidores) e ganha hook em `hooks/`. Mexer só no `handlers.ts` ou só no `adapter.ts` quebra um dos ambientes.
- Toda query key vive em `queryKeys` de `lib/queryClient`. Nada de array solto no `useQuery`.
- Dado de servidor é TanStack Query, não Zustand. Store é para sessão e estado de UI que atravessa telas.
- Resposta mockada devolve só o que a tela consome. Nada de hash, credencial, timestamp de auditoria ou flag interna no payload, porque esses contratos viram o backend depois.

## Mocks

O que está em `src/mocks/` é fluxo de desenvolvimento: o andaime que permitiu tocar o front do MVP sem backend. Fica como está, ninguém precisa desmontar. O que muda é daqui para frente: **feature nova não ganha mock**, fala com a API de verdade.

- Build que vai para usuário roda com `VITE_USE_MOCKS=false` e fala com a `VITE_API_URL` de verdade. Mock ligado é só `npm run dev` e `npm run dev:electron`.
- Fora de `src/mocks/` ninguém importa de `src/mocks/`. As duas únicas portas são o boot em `main.tsx` e a escolha de adapter em `lib/api.ts`. Tela, componente, hook e store nunca tocam fixture nem no banco em memória.
- Fixture é dado de demonstração, não conteúdo de produto. Texto, imagem e número que a tela precisa mostrar de verdade vêm da API, não de `mocks/fixtures`.
- Feature nova não pode depender de comportamento que só o mock tem. Se a rota não cabe num contrato que o backend vai cumprir, ela não entra.
- Conta de demonstração e latência artificial são de desenvolvimento e ficam no `.env.local`, nunca chumbadas no código.
- Rota, fixture e tela novas não entram em `mocks/routes.ts` nem em `mocks/fixtures`. Mexer ali é só para manter de pé o que já existe. Exceção aberta em 26/09/2026: "Gerenciamento de acessos" ganhou `fixtures/acessos.json` e as rotas `/studio/access` para a tela poder ser conferida contra o Figma antes do backend.

Estado atual, conhecido e aceito: o `lib/api.ts` importa `mockAdapter` de forma estática, então as fixtures viajam no bundle de produção mesmo com `VITE_USE_MOCKS=false`. Isso sai junto com a camada de mock quando o backend entrar, não antes.

## Vulnerabilidades

`npm audit` limpo é meta do projeto, não relatório para ignorar.

- Pacote novo não entra com alerta aberto. Se a única versão disponível é vulnerável, o pacote não entra.
- Alerta que aparecer sobe para a versão corrigida. Quando a correção é major, a atualização é feita sozinha, num PR só dela, nunca de carona numa feature.
- Subir versão exige provar que não quebrou: `npm run typecheck`, `npm test`, `npm run build`, o `ORBIT_ELECTRON=1 vite build` e a janela aberta no `npm run dev:electron`, nas duas roles. Sem isso a atualização não vai para a `main`.
- Alerta que não dá para corrigir agora fica registrado aqui embaixo, com o motivo, em vez de sumir com `--force`.

Estado em 14/09/2026: `npm audit` com 0 alertas. As três diretas que estavam vulneráveis subiram de major: `electron` 33 para 44, `electron-builder` 25 para 26 (levou junto o `node-tar`, origem do alerta crítico) e `react-router-dom` 6 para 7. Verificado com typecheck, testes, os dois builds, o app empacotado abrindo e o `npm run dev:electron`.

## Design system

O Figma é a fonte da verdade do design. Arquivo "Orbit Play" (`VaWtE2wPPYL7GvMqxCY2zY`), página `Design` (`1:71`), cluster de 1920px, mais a prancha `Design System` para tokens e componentes. O cluster de 1440px é iteração anterior e a página `Slide` é apresentação, os dois fora de escopo.

Layout, espaçamento, cor, tipografia, estado e texto de tela saem do frame correspondente, não de memória nem de intuição. Antes de mexer numa tela, abra o frame dela. Se não existe frame, não existe tela.

- Cor vem de `tailwind.config.js`, namespace `orbit.*`. Nada de hex solto no JSX.
- Gráfico usa as 14 cores de `src/utils/colors.ts`, nunca cor improvisada.
- Tipografia: Montserrat (display, headline, corpo, botões) e Ubuntu (label, tag, título pequeno).
- Breakpoints próprios: `folgado` (1360px) libera rótulos da navegação, `figma` (1660px) libera a tela como desenhada. Abaixo de `folgado` o layout é compacto.
- App é tema escuro sobre `#080321`. Card é translúcido de propósito: o glow do fundo passa por baixo.
- Divergir do desenho exige o ok de quem toca o design, e o motivo vai no PR. Divergência que já existe hoje: a versão na barra de título é a real do pacote, o arquivo desenha um número fixo.
- Os MCP do Figma estão configurados em `.mcp.json` (`figma` oficial e `figma-bridge`) e desligados em `.claude/settings.local.json`. Para enumerar páginas use o `figma-bridge`: a listagem do MCP oficial omite a página `Design`, embora leia a página normalmente quando recebe o nodeId.

## Electron

- `HashRouter` é obrigatório: a página roda em `file://` e o `BrowserRouter` quebra no refresh.
- A janela é frameless. A `TitleBar` fica fora do roteador, senão não há como fechar, minimizar ou arrastar.
- Renderer não usa API de Node. Tudo que precisa do main passa pelo `window.orbit` exposto no preload.
- Service worker não registra em `file://`, por isso o adapter do axios existe. Nunca assuma que o MSW está ativo.
- Atualização é local por `latest.json`, sem `electron-updater`. O main só responde se existe versão nova; quem instala é o usuário clicando na faixa.

## Testes unitários

Teste unitário é padrão do projeto, não item opcional de PR. O runner é o Vitest com jsdom e Testing Library, configurado no bloco `test` do `vite.config.ts`, então ele reaproveita o alias `@/` e os plugins do projeto. O Vitest 5 exige Vite 6, e é por isso que o projeto está no Vite 6.

O que precisa de teste:

- regra de negócio das rotas mockadas em `mocks/routes.ts` e `mocks/db.ts`: vaga que esgota e devolve 409, XP e recompensa calculados no submit, status derivado do catálogo
- estado das stores: transição de etapa e validação do rascunho na `testStore`, login e logout na `authStore`
- funções puras de `utils/`: formatação de moeda, duração, contagem regressiva e o merge de classes do `cn`
- componente de `components/UI` com comportamento próprio: estado desabilitado, `loading`, variante que muda o elemento renderizado

O que não precisa: tela inteira, layout, cor, espaçamento e qualquer coisa que o Figma decide. Isso se confere abrindo o app, não com asserção.

Convenções:

- arquivo ao lado do que ele testa, mesmo nome com sufixo `.test.ts` ou `.test.tsx`
- um comportamento por caso, com o nome em pt-BR dizendo a regra que está sendo garantida
- o mock do projeto já é o dado de teste: use as fixtures de `mocks/fixtures`, não invente um segundo conjunto
- o banco em memória é mutável e compartilhado entre casos; isole com `vi.resetModules()` e import dinâmico em vez de depender da ordem dos testes
- sem matcher de `jest-dom`: asserção é na propriedade do elemento (`.disabled`, `.value`, `textContent`), para não entrar mais uma dependência
- limpeza do DOM já vem de `src/test/setup.ts`, não repita `cleanup` em cada arquivo
- `npm test` é o único comando: em desenvolvimento ele fica em watch junto com o `npm run dev`, e para forçar uma rodada única basta `npm test -- --run`
- bug corrigido entra com o teste que o reproduz

## Fluxos por perfil

Existem dois perfis e nada além deles: `STUDIO` (a empresa dona do jogo) e `PLAYER` (o tester). O perfil vive em `user.role` na `authStore`, o guard é o `allow` do `MainLayout`, e o login recusa entrar com a conta de um perfil pela aba do outro.

Contas de demonstração, senha `123456`: `studio@orbitplay.com` e `player@orbitplay.com`.

### Estúdio

Caminho principal: home, meus jogos, detalhe do jogo, novo teste, teste rodando, relatório, sessão individual.

O que pode fazer:

- ver o painel com jogos, testes em andamento e estatísticas (`/studio`)
- listar os jogos do estúdio e abrir o detalhe de um deles (`/studio/games`, `/studio/games/:gameId`)
- criar um teste a partir do detalhe do jogo (`/studio/tests/new?game=<id>`), em quatro etapas do `Stepper` mais a confirmação: tipo do teste (Exploração livre com Telemetria, Exploração livre, Teste A/B, Teste A/B de imagens), perguntas da avaliação, upload da build, orçamento (público, verba, duração e vagas) e resumo de compra
- ler o relatório do teste com insights de IA, métricas e a lista de sessões (`/studio/reports/:testId`)
- abrir o relatório de telemetria do plug-in (`/studio/reports/:testId/plugin`)
- abrir a sessão de um tester específico (`/studio/reports/:testId/sessions/:sessionId`)

O que não pode: entrar em rota `/player`, jogar teste, criar jogo (tela removida) e exportar de fato, porque os botões de exportar dependem de backend e estão inertes de propósito.

Estado do rascunho de teste: fica na `testStore` e em `STORAGE_KEYS.testDraft`. A etapa só avança quando `isStepValid` passa, e o `Stepper` só deixa voltar até `maxStepReached`. Quem mexer nas etapas precisa manter essas três coisas coerentes.

### Tester

Caminho principal: home, catálogo de jogos, detalhe do jogo, tutorial, gameplay, resumo da sessão, resultado.

O que pode fazer:

- ver a home com o teste em andamento, destaques, XP, nível e saldo (`/player`)
- navegar o catálogo (`/player/games`) e o detalhe do jogo, com testes disponíveis, comunidade, conquistas e histórico (`/player/games/:gameId`)
- entrar num teste e reservar a vaga (`useStartTest`, `POST /player/tests/:testId/start`): a vaga incrementa `currentParticipants`, o teste vira `FULL` ao bater em `budget.slots` e daí o start responde 409
- ler o tutorial e confirmar que está pronto (`/player/test/:testId/tutorial`)
- jogar a sessão em tela cheia, sem navegação, no layout `bare` (`/player/test/:testId/gameplay`)
- responder a avaliação e enviar (`useSubmitSession`, `POST /player/tests/:testId/submit`): o mock calcula XP pela qualidade do feedback e pelos bugs reportados, sobe o nível, soma a recompensa em `pendingBalance` e desbloqueia conquistas
- ver o resultado da participação (`/player/test/:testId/result`)

O que não pode: entrar em rota `/studio`, ver relatório ou sessão de outro tester, e sacar saldo, porque a recompensa fica `PENDING` esperando aprovação que não tem tela.

Pendência conhecida: `useStartTest` e `useSubmitSession` existem e a rota mockada responde, mas nenhuma tela os chama ainda. O tutorial e o resumo hoje só navegam, e o resultado vem de `/player/session-outcome`, que é fixture. Ligar o fluxo de verdade é trocar essa navegação pelas mutations, sem inventar rota nova.

### Vale para os dois

- rota fora do perfil não dá erro, redireciona para a home do próprio perfil
- sem sessão, qualquer rota autenticada volta para `/login`
- item de menu sem tela no Figma fica inerte de propósito: no estúdio, Plug-in Telemetria, Benchmark, Tutorial e formação e Comunidade; no tester, Meus testes e ganhos, Tutorial e formação e Comunidade
- perfil novo, permissão nova ou tela que cruza os dois perfis não entra sem frame no Figma

## Rotas e escopo de telas

Rota nova exige três pontos: entrada em `ROUTES` (`utils/constants.ts`), `lazy` em `App.tsx` e o `MainLayout` com o `allow` do perfil certo.

O perfil de administrador e as telas `Novo Jogo` e `Central de Usuários` foram removidos a pedido, não reintroduza.

Tela nova só entra se existir frame correspondente no Figma.

## Commit e PR

A `main` é protegida por convenção: nada de commit ou push direto nela. Toda mudança sai numa branch a partir da `main` atualizada e entra por Pull Request para a `main`, com `npm run typecheck` e `npm test` passando antes de abrir.

Mensagem de commit em português, direta, dizendo o que mudou, no escopo do que está no diff. Descrição do PR em português, com o que mudou, o porquê e como conferir. O que precisa de explicação vai no corpo do commit ou no PR.

## Antes de entregar

1. `npm run typecheck` e `npm test` rodaram e passaram.
2. Testado antes de subir, nas duas roles: uma tela de estúdio e uma de tester, com as contas de demonstração.
3. Nenhum import órfão e nenhum caminho relativo onde cabia o alias `@/`.
4. `npm audit` não ganhou alerta novo por causa do diff.
5. Rota mockada nova está em `routes.ts`, não só em um dos consumidores.
6. Listener, timer e subscription criados têm remoção; nada de dado de tela sobrando na store.
