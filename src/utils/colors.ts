/**
 * Paleta do OrbitPlay em JS — para onde o Tailwind não alcança (Recharts, SVG inline).
 *
 * Fonte: Figma "Orbit Play", prancha "01 Color" (node 151:6041).
 * Mantenha em sincronia com `tailwind.config.js` e `styles/variables.css`.
 */
export const COLORS = {
  // Marca e ação
  orange: '#F8643B', // Support/S-Orange
  blue: '#248FF7', // Brand/B-Blue
  blueDeep: '#2563EB', // Marca/M-Azul
  blueDark: '#0D3388',
  purple: '#875AF2',

  // Superfícies (o app é escuro)
  bg: '#080321', // BW/Background
  card: 'rgba(243, 244, 248, 0.06)',
  border: 'rgba(243, 244, 248, 0.12)',
  greyDark: '#0F172A',
  white: '#FFFFFF',
  black: '#000000',

  // Texto sobre o escuro
  dim: '#E7E8E9',
  muted: '#A0A3A9',
  faint: '#585D68',

  // Neutros dos componentes
  dark: '#111827',
  heavy: '#8A8D91',
  medium: '#C5C9CE',
  light: '#E5E5ED',

  // Sistema
  success: '#1FC16B',
  successL: '#84EBB4',
  successBg: '#E9F9F1',
  error: '#D00416',
  errorL: '#FB3748',
  errorBg: '#FBE6E8',
  info: '#1248C1',
  infoL: '#6E97F2',
  infoBg: '#E8EDF9',
  warning: '#DFB400',
  warningL: '#FFDB43',
  warningBg: '#FCF8E6',
  separator: '#CBD5E1',

} as const;

/**
 * Graphic — as 14 cores de dados do design system.
 * São as cores oficiais de gráfico: não invente outras nem reuse as de marca.
 */
export const GRAPHIC = {
  sapphire: '#0289FF',
  amethyst: '#B400FF',
  ruby: '#EB3723',
  amber: '#EF780B',
  topaz: '#FFD52E',
  jade: '#0CF8C4',
  emerald: '#00FF78',
  midnight: '#014580',
  royal: '#5A0080',
  crimson: '#761B12',
  burnt: '#783C05',
  golden: '#806B17',
  imperial: '#067C62',
  deep: '#00803C',
} as const;

/**
 * Sequência categórica para séries de gráfico.
 * Ordenada por contraste entre vizinhas — as primeiras seis cobrem a maioria dos casos.
 */
export const CHART_COLORS = [
  GRAPHIC.sapphire,
  GRAPHIC.amethyst,
  GRAPHIC.emerald,
  GRAPHIC.amber,
  GRAPHIC.ruby,
  GRAPHIC.jade,
  GRAPHIC.royal,
  GRAPHIC.topaz,
  GRAPHIC.imperial,
  GRAPHIC.crimson,
  GRAPHIC.midnight,
  GRAPHIC.burnt,
  GRAPHIC.golden,
  GRAPHIC.deep,
] as const;

/** Eixos e grade sobre o fundo escuro: linhas discretas, rótulos em cinza claro. */
export const CHART_AXIS = {
  stroke: 'rgba(243, 244, 248, 0.12)',
  tick: { fill: COLORS.muted, fontSize: 12 },
} as const;

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#150C33',
  border: '1px solid rgba(243, 244, 248, 0.16)',
  borderRadius: 12,
  color: COLORS.white,
  fontSize: 13,
} as const;
