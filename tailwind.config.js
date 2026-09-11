import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      /**
       * Dois pontos de quebra próprios, para a janela.
       *
       * O Figma desenha tudo em 1920, mas a janela do app abre em 1440 e pode
       * chegar a 1180 — então o layout precisa de dois degraus antes de virar o
       * desenho original:
       *
       *   `folgado` (1360) — a partir daqui cabem os rótulos da navegação.
       *   `figma`   (1660) — a partir daqui cabe a tela como está desenhada:
       *                      lockup inteiro, espaçamentos de 24 e 4 colunas.
       *
       * Abaixo de `folgado` o app fica compacto: navegação só de ícones, menos
       * respiro nas laterais e grades de 2 colunas.
       */
      screens: {
        folgado: '1360px',
        figma: '1660px',
      },
      colors: {
        /**
         * Paleta do OrbitPlay — Figma "Orbit Play", página Design (node 1:71)
         * e prancha "01 Color" (151:6041).
         *
         * O app é ESCURO: fundo `BW/Background #080321`. As telas usam as duas
         * coleções de variables do arquivo ao mesmo tempo, então aqui elas vivem
         * numa paleta só — separar por coleção só induzia a erro.
         */
        orbit: {
          // --- Fundo e superfícies ---
          bg: '#080321', // BW/Background
          /** Chip/botão da navegação — valor literal do arquivo. */
          chip: 'rgba(243, 244, 248, 0.2)',
          /**
           * Superfície de card — valor literal dos frames da página Design:
           * fundo `rgba(255,255,255,0.2)` sobre borda sólida `#E5E5ED`, raio 24.
           * Translúcido de propósito: é o glow do fundo que passa por baixo.
           */
          card: 'rgba(255, 255, 255, 0.2)',
          'card-hover': 'rgba(255, 255, 255, 0.28)',
          border: '#E5E5ED',
          /** Campo de formulário sobre fundo escuro (Input do rodapé da tabela). */
          field: 'rgba(229, 229, 237, 0.2)',

          // --- Marca e ação ---
          orange: '#F8643B', // Support/S-Orange — item ativo e CTA
          blue: '#248FF7', // Brand/B-Blue
          'blue-deep': '#2563EB', // Marca/M-Azul
          'blue-dark': '#0D3388', // Marca/M-Azul Esc
          purple: '#875AF2', // Brand/B-Purple

          // --- Texto ---
          text: '#FFFFFF', // BW/White
          dim: '#E7E8E9', // Types and Elements/Light
          muted: '#A0A3A9', // Types and Elements/Medium
          faint: '#585D68', // Types and Elements/Heavy
          chrome: '#BABABA', // texto da title bar
          dark: '#111827', // Tipos e Elementos/Escuro (texto sobre claro)
          'grey-dark': '#0F172A', // Base - Grey/Dark

          // --- Neutros dos componentes (Tipos e Elementos) ---
          light: '#E5E5ED',
          medium: '#C5C9CE',
          heavy: '#8A8D91',

          // --- Sistema ---
          success: '#1FC16B',
          'success-l': '#84EBB4',
          'success-bg': '#E9F9F1',
          error: '#D00416',
          'error-l': '#FB3748',
          'error-bg': '#FBE6E8',
          info: '#1248C1',
          'info-l': '#6E97F2',
          'info-bg': '#E8EDF9',
          warning: '#DFB400',
          'warning-l': '#FFDB43',
          'warning-bg': '#FCF8E6',
          separator: '#CBD5E1',

          /** Graphic — as 14 cores oficiais de gráfico. */
          g: {
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
          },
        },
        // Tokens shadcn/ui (mapeados para as CSS variables em styles/variables.css)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        // Montserrat: display, headline, corpo, botões
        sans: ['Montserrat', 'Segoe UI', 'system-ui', 'sans-serif'],
        // Ubuntu: labels, tags e títulos pequenos (prancha Tag e Text)
        label: ['Ubuntu', 'Montserrat', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        /**
         * Escala tipográfica do design system (prancha "02 Text", node 151:6106).
         * Tudo Montserrat; lineHeight no Figma é 100%, daí o 1.
         * Os dois Display são Bold *Italic* — use `italic` junto, é assinatura da marca.
         */
        'display-lg': ['64px', { lineHeight: '1', fontWeight: '700' }],
        'display-md': ['48px', { lineHeight: '1', fontWeight: '700' }],
        headline: ['32px', { lineHeight: '1', fontWeight: '700' }],
        'headline-mobile': ['24px', { lineHeight: '1', fontWeight: '700' }],
        subtitle: ['20px', { lineHeight: '1', fontWeight: '500' }],
        body: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-bold': ['16px', { lineHeight: '1.5', fontWeight: '700' }],
        button: ['16px', { lineHeight: '1', fontWeight: '700' }],
        graphic: ['14px', { lineHeight: '1.4', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        'caption-bold': ['12px', { lineHeight: '1.4', fontWeight: '700' }],

        // Escala Ubuntu (labels e tags)
        'label-xs': ['10px', { lineHeight: '1.7', fontWeight: '700' }],
        'label-m': ['12px', { lineHeight: '18px', fontWeight: '700' }],
        'title-s': ['14px', { lineHeight: '22px', fontWeight: '700' }],
        'title-5': ['18px', { lineHeight: '1.5', fontWeight: '700' }],

        // Aliases usados pelas telas já escritas
        h1: ['32px', { lineHeight: '1', fontWeight: '700' }],
        h2: ['24px', { lineHeight: '1', fontWeight: '700' }],
        h3: ['20px', { lineHeight: '1.2', fontWeight: '700' }],
        h4: ['16px', { lineHeight: '1.4', fontWeight: '700' }],
        small: ['14px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      boxShadow: {
        orbit: '0 8px 24px -10px rgba(17, 24, 39, 0.18)',
        'orbit-lg': '0 16px 40px -12px rgba(17, 24, 39, 0.22)',
        cta: '0 8px 24px -8px rgba(248, 100, 59, 0.45)',
        glow: '0 0 0 1px rgba(37,99,235,0.35), 0 0 20px -4px rgba(37,99,235,0.35)',
        /**
         * Chanfro interno de todo botão preenchido da página Design.
         * Sempre no canto inferior direito — é o que dá o relevo dos botões.
         */
        bevel: 'inset -2px -2px 1px 0px rgba(255, 255, 255, 0.25)',
      },
      backgroundImage: {
        // Gradiente da marca (landing): roxo -> azul
        'orbit-gradient': 'linear-gradient(135deg, #875AF2 0%, #248FF7 100%)',
        'orbit-radial':
          'radial-gradient(1200px 600px at 10% -10%, rgba(135,90,242,0.28), transparent 60%), radial-gradient(900px 500px at 100% 0%, rgba(36,143,247,0.18), transparent 55%)',

        /**
         * Gradientes preenchidos da página Design. Os ângulos vêm do arquivo e
         * não são intercambiáveis: num botão largo e baixo a diferença entre
         * 110° e 146° é visível.
         */
        // Laranja (Support/S-Orange -> #EE7E5F): CTA e botão "Detalhes"
        'orbit-flame': 'linear-gradient(158.86deg, #F8643B 18.801%, #EE7E5F 81.199%)',
        // Mesma rampa em 167°, usada só no nome do estúdio em Bold Italic
        'orbit-flame-text': 'linear-gradient(167.25deg, #F8643B 18.801%, #EE7E5F 81.199%)',
        // Roxo -> azul: botão "Configurar!" do card de jogo (alto)
        'orbit-action': 'linear-gradient(145.98deg, #9060EF 0%, #1E93F8 100%)',
        // Mesma rampa deitada, para botões largos e baixos (Benchmark)
        'orbit-action-wide': 'linear-gradient(110.96deg, #9060EF 0%, #1E93F8 100%)',
        // Laranja deitada do botão "Completar" — stops próprios, não são os do flame
        'orbit-flame-wide': 'linear-gradient(110.96deg, #F6663E 0%, #EF7F5F 100%)',
        // Azul -> roxo (Brand/B-Nightfall): "Relatório" e "Configurar Orbit Plug-in"
        'orbit-nightfall': 'linear-gradient(165deg, #248FF7 18.801%, #875AF2 81.199%)',
        // Mesma rampa, quase na diagonal: ladrilho das conquistas (224:6222)
        'orbit-nightfall-tile': 'linear-gradient(121.07deg, #248FF7 18.801%, #875AF2 81.199%)',
        /**
         * Preenchimento do card de modelo recomendado: sobe do rodapé e some
         * antes do meio, por isso o segundo stop é transparente.
         */
        'orbit-recommended':
          'linear-gradient(18.39deg, #F8643B 7.193%, rgba(238, 126, 95, 0) 56.051%)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-rec': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.25' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 1.6s infinite',
        'fade-in': 'fade-in 0.25s ease-out',
        'pulse-rec': 'pulse-rec 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [animate],
};
