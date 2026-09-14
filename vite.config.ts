import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import electron from 'vite-plugin-electron/simple';
import renderer from 'vite-plugin-electron-renderer';

// `ORBIT_ELECTRON=1` liga o pipeline do Electron (npm run dev:electron / build:electron).
// Sem a flag, o Vite roda como um app web comum no browser (npm run dev).
const isElectron = process.env.ORBIT_ELECTRON === '1';

export default defineConfig({
  base: isElectron ? './' : '/',
  plugins: [
    react(),
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
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1600,
  },
});
