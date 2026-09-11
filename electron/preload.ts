import { contextBridge, ipcRenderer } from 'electron';

/**
 * Ponte segura entre o renderer (React) e o processo main.
 * Nada de `require`/Node dentro do renderer: so o que estiver exposto aqui.
 */
const orbitApi = {
  isElectron: true as const,
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),
  getPlatform: (): Promise<NodeJS.Platform> => ipcRenderer.invoke('app:get-platform'),
  selectFile: (filters?: Electron.FileFilter[]): Promise<string | null> =>
    ipcRenderer.invoke('dialog:select-file', filters),
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: (): Promise<boolean> => ipcRenderer.invoke('window:toggle-maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    /** `login` = cartão fixo de 926×619; `app` = janela cheia e redimensionável. */
    setMode: (mode: 'login' | 'app') => ipcRenderer.invoke('window:set-mode', mode),
  },
  update: {
    /** `null` quando não há feed ou a versão instalada já é a mais recente. */
    check: (): Promise<{ version: string; file: string } | null> =>
      ipcRenderer.invoke('update:check'),
    /** Abre o instalador e encerra o app. Devolve a mensagem de erro, ou `null`. */
    install: (file: string): Promise<string | null> =>
      ipcRenderer.invoke('update:install', file),
  },
};

contextBridge.exposeInMainWorld('orbit', orbitApi);

export type OrbitApi = typeof orbitApi;
