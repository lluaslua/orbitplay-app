/**
 * API exposta pelo preload do Electron (`electron/preload.ts`).
 *
 * A forma e declarada aqui em vez de importada do preload para manter o
 * projeto do renderer independente do projeto TS do processo main.
 */
export interface OrbitApi {
  isElectron: true;
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  selectFile: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>;
  window: {
    minimize: () => Promise<void>;
    toggleMaximize: () => Promise<boolean>;
    close: () => Promise<void>;
    /** `login` = cartão fixo de 926×619; `app` = janela cheia e redimensionável. */
    setMode: (mode: 'login' | 'app') => Promise<void>;
  };
  update: {
    check: () => Promise<{ version: string; file: string } | null>;
    install: (file: string) => Promise<string | null>;
  };
}

declare global {
  /**
   * Versão do `package.json`, injetada pelo Vite em tempo de build
   * (ver o `define` em `vite.config.ts`).
   *
   * Precisa ficar DENTRO de `declare global`: este arquivo tem `export {}` no
   * fim, o que o torna um módulo — no topo, a declaração teria escopo local e o
   * resto do projeto não a enxergaria.
   */
  const __VERSAO_DO_APP__: string;

  interface Window {
    /** `undefined` quando o app roda no browser. */
    orbit?: OrbitApi;
  }
}

export {};
