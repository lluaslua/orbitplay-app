import { defineConfig } from 'vitest/config';
import { loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import electron from 'vite-plugin-electron/simple';
import renderer from 'vite-plugin-electron-renderer';

// `ORBIT_ELECTRON=1` liga o pipeline do Electron (npm run dev:electron / build:electron).
// Sem a flag, o Vite roda como um app web comum no browser (npm run dev).
const isElectron = process.env.ORBIT_ELECTRON === '1';

/** Origem da API (`VITE_API_URL`): entra no processo principal do Electron e no CSP de produção. */
const apiUrl = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'VITE_').VITE_API_URL ?? process.env.VITE_API_URL ?? 'http://localhost:3333/api';
const apiOrigin = new URL(apiUrl).origin;

/**
 * CSP do build de produção. O `index.html` leva a política de desenvolvimento (o Vite
 * precisa de script inline e `eval` no dev server). No `vite build` ela é trocada por esta:
 * sem `unsafe-inline`/`unsafe-eval` em script, e `connect-src` só na API configurada.
 */
function cspDeProducao(): Plugin {
  return {
    name: 'orbitplay-csp-producao',
    apply: 'build',
    transformIndexHtml(html) {
      const ws = apiOrigin.replace(/^http/, 'ws');
      const politica = [
        "default-src 'self'",
        `img-src 'self' data: blob: ${apiOrigin}`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        "script-src 'self'",
        `connect-src 'self' ${apiOrigin} ${ws}`,
        'frame-src https://www.youtube-nocookie.com',
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
      ].join('; ');
      return html.replace(/(<meta\s+http-equiv="Content-Security-Policy"\s+content=")[^"]*(")/, `$1${politica}$2`);
    },
  };
}

export default defineConfig({
  base: isElectron ? './' : '/',
  plugins: [
    react(),
    cspDeProducao(),
    ...(isElectron
      ? [
          electron({
            main: {
              entry: 'electron/main.ts',
              vite: {
                build: {
                  outDir: 'dist-electron',
                  rollupOptions: { external: ['electron'] },
                },
                define: { __API_ORIGIN__: JSON.stringify(apiOrigin) },
              },
            },
            preload: {
              input: path.join(__dirname, 'electron/preload.ts'),
              vite: {
                build: {
                  outDir: 'dist-electron',
                  rollupOptions: {
                    external: ['electron'],
                    /**
                     * O preload TEM que sair como `.cjs`.
                     *
                     * O padrão do plugin é `preload.mjs`, mas o conteúdo gerado
                     * usa `require` — e o Electron carrega `.mjs` como ES module,
                     * onde `require` não existe. O preload falha em silêncio e
                     * `window.orbit` nunca chega ao renderer: sem botões de
                     * janela, sem verificação de atualização.
                     *
                     * `.js` também não serve aqui, porque o package.json declara
                     * `"type": "module"`. A extensão `.cjs` é a única que garante
                     * CommonJS.
                     */
                    output: { format: 'cjs', entryFileNames: 'preload.cjs' },
                  },
                },
              },
            },
          }),
          renderer(),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Respeita PORT para permitir mais de um dev server ao mesmo tempo.
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
  },
  /**
   * A versão do `package.json` entra no bundle em tempo de build.
   *
   * A barra de título mostrava um número fixo, e por isso quem reportasse um
   * problema não sabia dizer qual build estava rodando. Aqui o valor é lido do
   * mesmo lugar que o `electron-builder` usa para nomear o instalador, então os
   * dois nunca divergem — e funciona igual no navegador e no app empacotado,
   * sem depender do IPC do Electron.
   */
  define: {
    __VERSAO_DO_APP__: JSON.stringify(
      (JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf8')) as { version: string })
        .version,
    ),
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    // A latência artificial do mock é coisa do `npm run dev`; nos testes ela só atrasa o waitFor.
    // As suítes rodam sobre o mock em memória, mesmo com o `.env.local` apontando para a API.
    env: { VITE_MOCK_LATENCY: '0', VITE_USE_MOCKS: 'true' },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1600,
  },
});
