# OrbitPlay — MVP de front-end

Plataforma de playtesting em tempo real para estúdios de games. **Front-end apenas, com dados mockados** — nenhuma requisição sai da máquina.

## Rodar

```bash
npm install
```

```bash
npm run dev
```

Abre em http://localhost:5173. Para rodar dentro do Electron durante o desenvolvimento:

```bash
npm run dev:electron
```

### Contas de demonstração

Senha para todas: `123456`

| Perfil | E-mail |
| --- | --- |
| Estúdio | `studio@orbitplay.com` |
| Jogador | `player@orbitplay.com` |

O login valida o perfil contra a aba escolhida — entrar com a conta de estúdio na aba "Sou um tester" é recusado.

## Gerar o executável

```bash
npm run build:win
```

Produz em `release/`:

- `OrbitPlay-0.1.0-setup.exe` — instalador NSIS (~84 MB)
- `win-unpacked/OrbitPlay.exe` — app já descompactado, roda direto

O ícone vem de `build/icon.png`, gerado por `node build/make-icon.mjs` (desenha o logo e codifica o PNG sem dependência externa).

## Atualização automática (local)

```bash
npm run release
```

Sobe a versão (patch), empacota e publica em `~/OrbitPlayFeed`. Da próxima vez que você abrir o app instalado, aparece uma faixa no topo com a versão nova e um botão para atualizar.

Como funciona: `scripts/publish-local.mjs` escreve um `latest.json` ao lado do instalador; ao abrir, o app compara com a própria versão. Sem servidor, sem conta, sem rede. Para apontar para outra pasta, use a variável `ORBITPLAY_FEED`.

**Por que não usamos `electron-updater`:** ele só busca o feed por HTTP, o que exigiria um servidor no ar toda vez que o app abrisse. Quando for distribuir de verdade, ele é o caminho — aí a troca é o provider, não a interface.

**Por que o aviso não é um diálogo nativo:** a primeira versão usava `dialog.showMessageBox` na inicialização e ele retornou "Atualizar agora" **sem nenhum clique**, disparando o instalador sozinho. Hoje o processo main só responde "existe versão nova?"; quem decide é a faixa dentro do app. `runInstaller` não é alcançável sem uma ação do usuário.

Diagnóstico fica em `%APPDATA%\orbitplay-desktop\updater.log` — sem ele, uma checagem que devolve `null` é indistinguível de "não há atualização".

### "Cannot create symbolic link" — já resolvido automaticamente

O electron-builder baixa o pacote `winCodeSign` para pegar o `rcedit`, que grava ícone e metadados no `.exe`. Esse `.7z` traz symlinks do macOS, e o Windows só permite criá-los com **Modo de Desenvolvedor** ligado ou terminal como administrador. Sem isso a extração falha, o electron-builder tenta 4 vezes e desiste — **sem gerar instalador**. O `win-unpacked` ainda sai, então o erro passa fácil despercebido.

`scripts/ensure-wincodesign.mjs` roda antes do empacotamento e extrai o pacote excluindo `darwin*` (pasta que só serve para assinar builds de macOS). Não é preciso fazer nada.

**A pegadinha:** o cache fica em `Cache\winCodeSign\2.6.0` — só a versão, **sem** o prefixo `winCodeSign-` que aparece na URL de download. Pré-extrair usando o nome da URL não adianta: o app-builder ignora a pasta e baixa tudo de novo.

## Stack

React 18 · TypeScript · Vite 5 · Electron 33 · Tailwind 3 · Zustand · TanStack Query · React Hook Form + Zod · Recharts · Radix UI · Axios

## Como os dados mockados funcionam

Uma única tabela de rotas (`src/mocks/routes.ts`) alimenta dois consumidores:

- **`handlers.ts`** → MSW, quando o app roda no browser
- **`adapter.ts`** → adapter do Axios, que funciona também no Electron

O adapter existe por um motivo concreto: no Electron a página roda em `file://`, onde **service worker não registra** — o MSW sozinho não funcionaria no executável. As duas vias respondem idêntico porque partem da mesma tabela.

Trocar para um backend real é `VITE_USE_MOCKS=false` no `.env.local`; nenhum hook ou tela muda.

## Design system

Os tokens vêm do arquivo Figma "Orbit Play" (`VaWtE2wPPYL7GvMqxCY2zY`), prancha *Design System*.

O arquivo tem **duas coleções de variables** que não são equivalentes:

| | Coleção pt-BR | Coleção en |
| --- | --- | --- |
| Onde | componentes = UI do app | landing page (frames `Home`) |
| Tema | claro (`#F3F4F8`) | escuro (`#080321`) |
| Ação | `#2563EB` | `#875AF2` / `#248FF7` |
| Neutros | `#8A8D91` `#C5C9CE` `#E5E5ED` | `#585D68` `#A0A3A9` `#E7E8E9` |

No código: a do app vive em `orbit.*`, a da landing em `orbit.mkt.*`. Misturar as duas gera cor errada.

São também **duas famílias tipográficas**: Montserrat (display em *Bold Italic*, headline, corpo, botões) e Ubuntu (labels, tags, títulos pequenos).

Gráficos usam as 14 cores `Graphic` da prancha Color, expostas em `src/utils/colors.ts`.

## Estrutura

```
electron/          processo main, preload e config de build
src/
  components/      Auth · Studio · Player · Admin · Common · UI
  pages/           as 20 telas, carregadas sob demanda
  hooks/           TanStack Query por domínio
  stores/          Zustand: auth, games, testes
  mocks/           fixtures, banco em memória, rotas, MSW e adapter
  types/           contratos compartilhados com o backend futuro
  utils/           paleta, constantes e helpers
```

## Estado do MVP

As telas estão implementadas e navegáveis, e a fundação já foi refeita em cima do Figma: tema escuro, barra de título do Electron, navegação no topo e tokens colapsados numa paleta só.

**Falta refazer o layout de cada tela a partir do frame correspondente** e trocar os fixtures para o conteúdo do Figma. Hoje o layout ainda é interpretação; os componentes e os tokens é que vieram com valores exatos.

Telas sem frame no Figma foram removidas a pedido — `Novo Jogo` e a `Central de Usuários`, junto com o perfil de administrador inteiro. Itens de menu que o Figma desenha mas não tem tela (Benchmark, Tutorial e formação, Comunidade) aparecem inertes, sem navegar.

### Onde ficam as telas no Figma

Página `Design` (`1:71`), cluster de 1920px. O cluster de 1440px é iteração anterior e a página `Slide` é apresentação — ambos fora do escopo.

Ao listar as páginas do arquivo, o MCP oficial devolve só `Cover + Logo` e `Design System`, **omitindo `Design`**. Ele enxerga a página normalmente quando recebe o nodeId; é só a listagem que mente. Para enumerar páginas, use o `figma-bridge`, que lê o documento vivo pelo plugin.
