import type { GameStatus, Platform, TestModel, TestStatus, UserRole, UserStatus } from '@/types';
import type { ParticipationStatus, RewardStatus } from '@/types/player';
import type {
  ArchetypeId,
  PlayerTypeId,
  QuestionType,
  TestLocation,
  TestModelInfo,
} from '@/types/test';

export const APP_NAME = 'OrbitPlay';

/**
 * Aparece na barra de título (Figma: node `291:1260`).
 *
 * O arquivo desenha "v1.0.0.2" fixo; aqui vale a versão real do pacote, injetada
 * pelo Vite. É uma divergência deliberada do desenho: um número que não muda não
 * serve para saber qual build o usuário está rodando.
 */
export const APP_VERSION = __VERSAO_DO_APP__;

export const STORAGE_KEYS = {
  token: 'orbitplay:token',
  user: 'orbitplay:user',
  remember: 'orbitplay:remember',
  testDraft: 'orbitplay:test-draft',
  gameImages: 'orbitplay:game-images',
} as const;

export const ROUTES = {
  login: '/login',
  studio: {
    home: '/studio',
    games: '/studio/games',
    game: (id: string) => `/studio/games/${id}`,
    newGame: '/studio/games/new',
    newTest: '/studio/tests/new',
    report: (testId: string) => `/studio/reports/${testId}`,
    session: (testId: string, sessionId: string) =>
      `/studio/reports/${testId}/sessions/${sessionId}`,
    plugin: (testId: string) => `/studio/reports/${testId}/plugin`,
  },
  player: {
    home: '/player',
    catalog: '/player/games',
    game: (id: string) => `/player/games/${id}`,
    tutorial: (testId: string) => `/player/test/${testId}/tutorial`,
    gameplay: (testId: string) => `/player/test/${testId}/gameplay`,
    summary: (testId: string) => `/player/test/${testId}/summary`,
    result: (testId: string) => `/player/test/${testId}/result`,
  },
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  STUDIO: 'Estúdio',
  PLAYER: 'Jogador',
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  PENDING: 'Pendente',
};

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  ACTIVE: 'Ativo',
  DRAFT: 'Rascunho',
  PAUSED: 'Pausado',
  ARCHIVED: 'Arquivado',
};

/** Rótulos das tabelas do estúdio — texto exato do Figma. */
export const TEST_STATUS_LABELS: Record<TestStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Em andamento',
  FULL: 'Lotado',
  PROCESSING: 'Gerando insights IA',
  FINISHED: 'Finalizado',
  PAUSED: 'Pausado',
};

/** Tom da tag por estado: o par escuro/vivo das cores Graphic. */
export const TEST_STATUS_TONES = {
  DRAFT: 'topaz',
  ACTIVE: 'amber',
  FULL: 'sapphire',
  PROCESSING: 'amethyst',
  FINISHED: 'emerald',
  PAUSED: 'ruby',
} as const satisfies Record<TestStatus, string>;

export const PARTICIPATION_STATUS_LABELS: Record<ParticipationStatus, string> = {
  AVAILABLE: 'Começar',
  IN_PROGRESS: 'Continuar',
  PENDING_REVIEW: 'Em análise',
  COMPLETED: 'Completo',
  UNAVAILABLE: 'Indisponível',
  REJECTED: 'Recusado',
};

export const REWARD_STATUS_LABELS: Record<RewardStatus, string> = {
  PENDING: 'Pendente de validação',
  VALIDATED: 'Validada',
  PAID: 'Paga',
  REJECTED: 'Recusada',
};

export const TEST_MODEL_LABELS: Record<TestModel, string> = {
  TELEMETRY: 'Exploração livre + Telemetria',
  FREE_EXPLORATION: 'Exploração livre',
  AB_TEST: 'Teste A/B',
  AB_IMAGES: 'Teste A/B de imagens',
};

/**
 * Os 4 cards da etapa 1 do Novo teste — texto e preços exatos do Figma
 * (`318:6534`, `318:6467`, `318:6499`, `318:6512`).
 */
export const TEST_MODELS: TestModelInfo[] = [
  {
    id: 'TELEMETRY',
    name: 'Exploração livre + Telemetria',
    tagline: 'Observe o jogador sem interferir. Entenda o comportamento real.',
    description:
      'Nesse modelo, o jogador explora o jogo normalmente, enquanto o estúdio define previamente quais gatilhos, eventos e comportamentos serão medidos. Esses gatilhos são integrados diretamente na build do jogo, permitindo que o plugin de telemetria da OrbitPlay colete dados precisos e relevantes da sessão, revelando como o jogo é realmente jogado, e não apenas o que o jogador relata.',
    deliversTitle: 'O que a telemetria captura:',
    delivers: [
      'Caminhos mais percorridos no mapa.',
      'Tempo de permanência por área ou fase.',
      'Eventos acionados (combate, interação, falha, abandono).',
      'Pontos de confusão, repetição ou desistência.',
      'Ritmo de progressão do jogador.',
    ],
    pricePerTestCents: 69,
    recommended: true,
    requiresPlugin: true,
    icon: 'telemetry',
  },
  {
    id: 'FREE_EXPLORATION',
    name: 'Exploração livre',
    tagline: 'Ideal para descobertas espontâneas.',
    description:
      'O jogador explora a demo livremente, por tempo ou por fase, sem coleta automática de dados. Os insights vêm da gravação da gameplay e do feedback final, focando nas impressões reais, sensações e opiniões do player.',
    deliversTitle: 'O que entrega:',
    delivers: [
      'Gameplay livre com gravação e transcrição automática.',
      'Insights de IA sobre comportamento, frustração, diversão e engajamento.',
      'Linha de humor/emocional ao longo do tempo ou por fase.',
      'Análise aplicável a jogos 2D ou 3D, sem limitação de gênero.',
      'Pesquisa pós-teste personalizada pelo seu estúdio, focada nos objetivos do projeto.',
    ],
    pricePerTestCents: 59,
    icon: 'free',
  },
  {
    id: 'AB_TEST',
    name: 'Teste A/B',
    tagline: 'Ideal para comparar versões.',
    description:
      'Nesse modelo, jogadores testam duas versões jogáveis do mesmo jogo (Build A e Build B). A plataforma compara automaticamente métricas de engajamento, dificuldade, retenção e feedback qualitativo, permitindo identificar qual versão entrega a melhor experiência antes do lançamento.',
    deliversTitle: 'O que entrega:',
    delivers: [
      'Comparação direta entre duas builds ou variações',
      'Métricas estatísticas claras',
      'Recomendação automática da melhor versão',
    ],
    pricePerTestCents: 39,
    icon: 'ab',
  },
  {
    id: 'AB_IMAGES',
    name: 'Teste A/B de imagens',
    tagline: 'Teste rapidamente qual visual gera mais impacto e clareza.',
    description:
      'Jogadores avaliam duas ou mais variações visuais (ex: UI, HUD, menus, personagens ou telas de loja) sem precisar jogar. A IA analisa preferências, clareza, impacto visual e intenção do jogador, ajudando o estúdio a decidir rapidamente qual versão funciona melhor.',
    deliversTitle: 'O que entrega:',
    delivers: [
      'Comparação direta entre duas ou mais variações visuais.',
      'Métricas de preferência, clareza e impacto visual.',
      'Insights de IA sobre atenção, compreensão e decisão do jogador.',
      'Resultados rápidos, sem necessidade de build jogável.',
      'Pesquisa final personalizada pelo estúdio para validar a escolha.',
    ],
    pricePerTestCents: 19,
    icon: 'ab-images',
  },
];

export const GENRES = [
  'Ação',
  'Aventura',
  'Corrida',
  'Estratégia',
  'Puzzle',
  'RPG',
  'Simulação',
  'Esporte',
  'Terror',
  'Casual',
] as const;

export const PLATFORMS = ['PC', 'MAC', 'LINUX', 'ANDROID', 'IOS', 'WEB', 'CONSOLE'] as const;

export const REGIONS = ['Brasil', 'América Latina', 'América do Norte', 'Europa', 'Ásia'] as const;

/**
 * Etapa 1 de "Novo jogo" — opções dos frames `Dropdown` abaixo do fluxo no
 * Figma. Plataformas guardam o `Platform` do contrato e mostram o rótulo do
 * arquivo; idiomas levam a bandeira (`Flag`).
 */
export const NEW_GAME_PLATFORMS = [
  { valor: 'PC', rotulo: 'Windows' },
  { valor: 'ANDROID', rotulo: 'Android' },
  { valor: 'IOS', rotulo: 'iOS' },
  { valor: 'WEB', rotulo: 'Web' },
] as const satisfies readonly { valor: Platform; rotulo: string }[];

export const GAME_MODES = ['Single Player', 'Multiplayer', 'PvP', 'PvE', 'Co-op'] as const;

export const GAME_ENGINES = ['Unity', 'Unreal', 'Godot', 'Proprietária', 'Outra'] as const;

/** A nota ao lado do frame inclui "Lançado", que o dropdown desenhado corta. */
export const GAME_DEV_STAGES = [
  'Conceito',
  'Protótipo',
  'Alpha',
  'Beta',
  'Early Access',
  'Lançado',
] as const;

export const GAME_AGE_RATINGS = ['Livre (L)', '12 Anos', '14 Anos', '16 Anos', '18 Anos'] as const;

export const GAME_LANGUAGES = [
  { valor: 'Português', rotulo: 'Português', icone: './icons/figma/bandeira-brasil.svg' },
  { valor: 'Inglês', rotulo: 'Inglês', icone: './icons/figma/bandeira-reino-unido.svg' },
  { valor: 'Espanhol', rotulo: 'Espanhol', icone: './icons/figma/bandeira-espanha.svg' },
  { valor: 'Francês', rotulo: 'Francês', icone: './icons/figma/bandeira-franca.svg' },
  { valor: 'Alemão', rotulo: 'Alemão', icone: './icons/figma/bandeira-alemanha.svg' },
] as const;

/** Rótulos do stepper de "Novo jogo" — Informações, Mídias, Permissões. */
export const NEW_GAME_STEPS = ['Informações', 'Mídias', 'Permissões'] as const;

/** As 4 colunas de permissão da tabela da etapa 3 (Figma), nesta ordem. */
export type PermissionKey = 'editPermissions' | 'editInfo' | 'editTests' | 'viewReports';

export const PERMISSION_COLUMNS: { key: PermissionKey; label: string }[] = [
  { key: 'editPermissions', label: 'Editar Permissões/excluir projeto' },
  { key: 'editInfo', label: 'Editar informações gerais' },
  { key: 'editTests', label: 'Criar/editar testes' },
  { key: 'viewReports', label: 'Acessar relatórios' },
];

export interface PermissionRow {
  id: string;
  kind: 'group' | 'member';
  name: string;
  /** "2 perfis" nos grupos. */
  meta?: string;
  permissions: Record<PermissionKey, boolean>;
}

/**
 * Linhas com que a etapa 3 de "Novo jogo" já abre, tons exatos do print. Os
 * grupos e membros disponíveis para adicionar vêm de `useStudioTeam`
 * (`GET /studio/team`, mockado em `src/mocks/db.ts`) — "Analitics" é grafado
 * assim no arquivo do Figma, não "Analytics".
 */
export const NEW_GAME_DEFAULT_PERMISSIONS: PermissionRow[] = [
  {
    id: 'grp-diretores',
    kind: 'group',
    name: 'Diretores',
    meta: '2 perfis',
    permissions: { editPermissions: true, editInfo: true, editTests: true, viewReports: true },
  },
  {
    id: 'grp-qa',
    kind: 'group',
    name: 'QA',
    meta: '25 perfis',
    permissions: { editPermissions: false, editInfo: true, editTests: true, viewReports: true },
  },
  {
    id: 'grp-analitics',
    kind: 'group',
    name: 'Analitics',
    meta: '12 perfis',
    permissions: { editPermissions: false, editInfo: false, editTests: false, viewReports: true },
  },
  {
    id: 'mem-hideo',
    kind: 'member',
    name: 'Hideo Kojima',
    permissions: { editPermissions: true, editInfo: true, editTests: false, viewReports: false },
  },
  {
    id: 'mem-guilherme',
    kind: 'member',
    name: 'Guilherme Hoffmann',
    permissions: { editPermissions: false, editInfo: false, editTests: false, viewReports: true },
  },
];

/** Taxa da plataforma aplicada no orçamento (Etapa 4). */
export const PLATFORM_FEE_RATE = 0.15;

/** Etapa 2 do tutorial — "O que observar?" (Figma `224:7334`). */
export const TUTORIAL_OBSERVAR = [
  {
    titulo: 'Bugs & travamentos',
    texto:
      'O jogo travou, fechou sozinho ou congelou? Personagens, carros ou objetos ficaram presos ou sumiram? Alguma ação não funcionou como deveria?',
    chamada: 'Diga o que aconteceu e em que momento.',
  },
  {
    titulo: 'Dificuldade da fase',
    texto:
      'A fase está fácil demais ou difícil demais? Ficou claro o que você precisava fazer? Algum trecho parece injusto ou frustrante?',
    chamada: 'Conte como você se sentiu jogando.',
  },
  {
    titulo: 'Áudio / narrativa',
    texto:
      'Sons e músicas combinam com o jogo? O áudio está claro ou atrapalha a jogabilidade? A narrativa faz sentido e ajuda na imersão?',
    chamada: 'Destaque se algo ajudou ou atrapalhou sua experiência.',
  },
  {
    titulo: 'Gráficos / interface',
    texto:
      'Os gráficos estão bonitos e consistentes? A interface é clara e fácil de entender? Botões, textos e ícones estão visíveis durante a ação?',
    chamada: 'Aponte o que está confuso, bonito ou poderia melhorar.',
  },
];

/** Etapa 3 do tutorial — "Dicas para o formulário" (Figma `224:7409`). */
export const TUTORIAL_DICAS = [
  {
    titulo: 'Seja específico',
    texto:
      'Em vez de "não gostei do inimigo", escreva "o inimigo na fase 2 demora muito para reagir e isso deixou a luta cansativa".',
  },
  {
    titulo: 'Descreva o contexto',
    texto:
      'Exemplo: "O bug aconteceu quando eu pulei pela segunda vez na plataforma depois de derrotar o chefe."',
  },
  {
    titulo: 'Equilibre crítica e elogio',
    texto: '"Gostei da arte do cenário, mas achei que os sons estavam baixos demais."',
  },
  {
    titulo: 'Pense como jogador e como estúdio',
    texto:
      'Imagine que seu feedback será usado pela equipe de desenvolvimento para ajustar o game. Quanto mais claro, mais útil!',
  },
];

/** "Localização*" da etapa 4. */
export const TEST_LOCATIONS: { id: TestLocation; label: string }[] = [
  { id: 'BRASIL', label: 'Brasil' },
  { id: 'EUA', label: 'Estados Unidos da América' },
  { id: 'GLOBAL', label: 'Global' },
];

/**
 * Cards de "Tipo de jogador" (Figma `319:9516`).
 *
 * `tier` é a faixa de preço em cifrões que o card mostra. O único adicional que
 * o arquivo declara em reais é o do Experiente, que aparece no resumo como
 * "+ R$ 0,10/teste"; os demais seguem a escala de cifrões.
 */
export const PLAYER_TYPES: {
  id: PlayerTypeId;
  name: string;
  description: string;
  tier: string;
  extraCents: number;
}[] = [
  { id: 'ALL', name: 'Todos', description: 'Combina diferentes perfis e estilos de jogo. Ideal para obter uma visão ampla e equilibrada da experiência geral do jogo.', tier: '$$', extraCents: 10 },
  { id: 'CASUAL', name: 'Casual', description: 'Avalia diversão, clareza e primeira impressão do jogo. Ideal para validar se o jogo é intuitivo para o público geral.', tier: '$', extraCents: 0 },
  { id: 'EXPERIENT', name: 'Experiente', description: 'Analisa dificuldade, balanceamento e compara com outros jogos do gênero.', tier: '$$', extraCents: 10 },
  { id: 'TRAINED', name: 'Tester treinado', description: 'Entrega feedback estruturado, claro e acionável para decisões de design e UX.', tier: '$$$', extraCents: 15 },
  { id: 'QA', name: 'QA Profissionais', description: 'Identifica bugs, glitches, problemas de performance e acessibilidade, com passos de reprodução.', tier: '$$$$', extraCents: 25 },
];

/** Cards de "Arquétipos" (Figma `319:9516`). Não alteram o preço. */
export const ARCHETYPES: { id: ArchetypeId; name: string; description: string }[] = [
  { id: 'ALL', name: 'Todos', description: 'Inclui diferentes estilos de jogo para revelar padrões variados de comportamento, decisões e engajamento ao longo da experiência.' },
  { id: 'CONQUEROR', name: 'Conquistador', description: 'Focado em progresso, metas e recompensas. Gera insights sobre pacing, economia e sistemas de progressão.' },
  { id: 'EXPLORER', name: 'Explorador', description: 'Curioso por natureza. Revela problemas de level design, orientação e áreas pouco exploradas.' },
  { id: 'SOCIALIZER', name: 'Socializador', description: 'Atento à narrativa e interações. Avalia diálogos, personagens e engajamento emocional.' },
  { id: 'KILLER', name: 'Assassino', description: 'Competitivo e orientado à performance. Detecta problemas de balanceamento e frustração em desafios e PvP.' },
];

/**
 * Ícones de 48 dos cards de "Tipo de jogador" (Figma `322:2310`) e de
 * "Arquétipos" (`322:2450`), exportados do arquivo para
 * `public/icons/figma/publico/`. O "Todos" é o mesmo desenho nas duas fileiras.
 */
export const PLAYER_TYPE_ICONS: Record<PlayerTypeId, string> = {
  ALL: 'publico/todos',
  CASUAL: 'publico/casual',
  EXPERIENT: 'publico/experiente',
  TRAINED: 'publico/tester-treinado',
  QA: 'publico/qa',
};

export const ARCHETYPE_ICONS: Record<ArchetypeId, string> = {
  ALL: 'publico/todos',
  CONQUEROR: 'publico/conquistador',
  EXPLORER: 'publico/explorador',
  SOCIALIZER: 'publico/socializador',
  KILLER: 'publico/assassino',
};

/** Adicional do "Impulsionar teste!", por teste. */
export const BOOST_CENTS = 15;

/** Formas de pagamento listadas no resumo da compra. */
export const PAYMENT_METHODS = ['Pix BR$', 'Boleto', 'Cartão de crédito', 'PayPal'];

/** "Próximos passos" da tela de pagamento concluído (Figma `757:6564`). */
export const NEXT_STEPS_AFTER_PAYMENT = [
  'Revise as configurações do teste.',
  'Compartilhe o convite com os jogadores, se necessário.',
  'Acompanhe os participantes recrutados.',
  'Monitore o andamento das sessões.',
  'Analise feedbacks e telemetria após o início dos testes.',
];

/**
 * Resultado da leitura da build na etapa 3 (Figma `319:8624`).
 *
 * Num app com backend isto viria do parser do Orbit Plug-in. Aqui é fixo, com o
 * conteúdo exato do arquivo, porque o que a tela mostra é justamente a lista
 * detectada.
 */
export interface PluginDetection {
  id: string;
  /** Texto da tag de tipo da variável, ex.: "Int". */
  varType: string;
  varTone: 'emerald' | 'sapphire' | 'amethyst';
  name: string;
  kind: string;
  /** `false` deixa "Quantidade controle" como "Indisponível". */
  amountEditable: boolean;
  /** Rótulos das caixas de seleção da coluna "Ações". */
  metrics: string[];
}

export const PLUGIN_TRIGGERS: PluginDetection[] = [
  { id: 'tr-1', varType: 'Int', varTone: 'emerald', name: 'BOSS01_Defeat', kind: 'Contador', amountEditable: true, metrics: ['Média', 'Total', 'Tempo médio'] },
  { id: 'tr-2', varType: 'Time.DeltaTime', varTone: 'sapphire', name: 'Tempo_Fase02', kind: 'Contador tempo', amountEditable: true, metrics: ['Média', 'Máximo/minimo'] },
  { id: 'tr-3', varType: 'Int', varTone: 'emerald', name: 'Menu_Loja', kind: 'Contador UI', amountEditable: true, metrics: ['Total', 'Tempo médio entre contagem'] },
  { id: 'tr-4', varType: 'Vector3.position', varTone: 'amethyst', name: 'Movimentação', kind: 'Vector3', amountEditable: false, metrics: ['Média', 'Angulo médio'] },
  { id: 'tr-5', varType: 'Int', varTone: 'emerald', name: 'ESPECIAL_UNO', kind: 'Contador Input', amountEditable: true, metrics: ['Total', 'Tempo médio entre contagem'] },
];

export const PLUGIN_HEATMAPS: PluginDetection[] = [
  { id: 'hm-1', varType: 'Vector3.position', varTone: 'amethyst', name: 'Fase_01_São Paulo', kind: 'Vector3', amountEditable: false, metrics: ['Média', 'Angulo médio'] },
  { id: 'hm-2', varType: 'Int', varTone: 'emerald', name: 'BOSS01_Defeat', kind: 'Contador', amountEditable: true, metrics: ['Média', 'Total', 'Tempo médio'] },
];

/**
 * Opções do seletor "Tipo da pergunta" da etapa 2, na ordem do menu do Figma.
 * Os separadores marcam os grupos que o menu desenha com linha divisória.
 */
export const QUESTION_TYPES: {
  id: QuestionType;
  label: string;
  /** Recebe a tag "Nova" no menu. */
  isNew?: boolean;
  /** Abre um grupo novo — o menu põe uma linha acima. */
  startsGroup?: boolean;
}[] = [
  { id: 'SHORT_TEXT', label: 'Resposta curta' },
  { id: 'PARAGRAPH', label: 'Parágrafo' },
  { id: 'MULTIPLE_CHOICE', label: 'Múltipla escolha', startsGroup: true },
  { id: 'CHECKBOXES', label: 'Caixas de seleção' },
  { id: 'DROPDOWN', label: 'Lista suspensa' },
  { id: 'FILE_UPLOAD', label: 'Upload de arquivo', startsGroup: true },
  { id: 'LINEAR_SCALE', label: 'Escala linear', startsGroup: true },
  { id: 'RATING', label: 'Classificação', isNew: true },
  { id: 'MULTIPLE_CHOICE_GRID', label: 'Grade de múltipla escolha' },
  { id: 'CHECKBOX_GRID', label: 'Grade da caixa de seleção' },
  { id: 'DATE', label: 'Data', startsGroup: true },
  { id: 'TIME', label: 'Horário' },
];

export const QUESTION_TYPE_LABELS = Object.fromEntries(
  QUESTION_TYPES.map((tipo) => [tipo.id, tipo.label]),
) as Record<QuestionType, string>;

/**
 * Rótulos do stepper — os quatro do Figma (`318:6417`). A quinta tela do fluxo
 * é a confirmação, que aparece depois do stepper e não tem bolinha própria.
 */
export const TEST_STEPS = [
  { id: 1, title: 'Tipo', description: 'Escolha o tipo de teste' },
  { id: 2, title: 'Avaliação', description: 'Monte as perguntas' },
  { id: 3, title: 'Build', description: 'Envie o executável' },
  { id: 4, title: 'Orçamento', description: 'Público, verba e duração' },
] as const;

/** Tamanho máximo de uma mensagem no chat da comunidade — o campo e a API usam o mesmo. */
export const CHAT_MESSAGE_MAX_LENGTH = 1000;
