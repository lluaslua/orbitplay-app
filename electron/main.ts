import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAvailableUpdate, runInstaller } from './updater';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// dist-electron/main.js  ->  raiz do projeto/app empacotado
process.env.APP_ROOT = path.join(__dirname, '..');

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
const PUBLIC_DIR = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let mainWindow: BrowserWindow | null = null;

/**
 * A janela tem duas formas, e é o Figma que manda nisso.
 *
 * No login (`181:8146`) o app é um cartão fixo de 926×619 com cantos de 24 e
 * **sem barra de título** — nem os botões de janela. Depois de entrar, os frames
 * passam a desenhar a barra `OrbitPlay v1.0.0.2 | View | Help` com minimizar,
 * maximizar e fechar, e a janela vira o app inteiro, redimensionável.
 *
 * Quem troca é o renderer, quando a sessão muda (`window:set-mode`).
 */
const LOGIN = { width: 926, height: 619 };
const APP = { width: 1440, height: 900, minWidth: 1180, minHeight: 720 };

/**
 * Posição e tamanho da janela antes de maximizar.
 *
 * O `unmaximize` do Electron costuma restaurar sozinho, mas aqui a janela também
 * é redimensionada por código (`aplicarModo`) e alterna `resizable` — e no
 * Windows isso pode zerar essa memória, fazendo o restaurar cair no tamanho
 * padrão em vez de voltar ao que o usuário tinha deixado. Então o valor é
 * guardado explicitamente na ida e reaplicado na volta.
 *
 * Guarda o retângulo inteiro, não só a largura e a altura: restaurar no tamanho
 * certo mas no canto errado seria igualmente irritante.
 */
let janelaAntesDeMaximizar: Electron.Rectangle | null = null;

function aplicarModo(modo: 'login' | 'app') {
  if (!mainWindow) return;

  // A janela vai ser remodelada por código: o tamanho anterior perde o sentido.
  janelaAntesDeMaximizar = null;

  // Redimensionar uma janela travada não faz nada no Windows: destrava primeiro.
  mainWindow.setResizable(true);
  if (mainWindow.isMaximized()) mainWindow.unmaximize();

  if (modo === 'login') {
    // O mínimo cai antes do tamanho, senão o Windows ignora o encolhimento.
    mainWindow.setMinimumSize(LOGIN.width, LOGIN.height);
    mainWindow.setSize(LOGIN.width, LOGIN.height);
    mainWindow.center();
    mainWindow.setResizable(false);
    mainWindow.setMaximizable(false);
    return;
  }

  mainWindow.setSize(APP.width, APP.height);
  mainWindow.setMinimumSize(APP.minWidth, APP.minHeight);
  mainWindow.center();
  mainWindow.setMaximizable(true);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    // Abre no formato do login; o renderer chama `window:set-mode` se já houver
    // sessão salva, e aí a janela cresce.
    width: LOGIN.width,
    height: LOGIN.height,
    resizable: false,
    maximizable: false,
    show: false,
    /**
     * Transparente por causa do canto arredondado do login.
     *
     * O Windows 10 (que é o alvo aqui) não arredonda janela sem moldura como o
     * 11 faz — o canto tem que vir do CSS, e para o canto do CSS aparecer a
     * janela precisa ser transparente por baixo. Por isso o fundo escuro é
     * pintado pelo `body`, não pelo `backgroundColor` da janela.
     */
    transparent: true,
    backgroundColor: '#00000000',
    title: 'OrbitPlay',
    icon: path.join(PUBLIC_DIR, 'icons/orbitplay-logo.png'),
    // A barra de título é desenhada pelo app (componente TitleBar, node 291:1260
    // no Figma), então a nativa sai. Os botões de janela vão pelo IPC do preload.
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      // .cjs, não .mjs: ver o comentário em vite.config.ts sobre o preload.
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  /*
   * A restauração é tratada no evento, não no handler do botão: assim vale
   * também quando quem restaura é o Windows (Win+Seta para baixo, duplo clique
   * na barra), que não passa pelo nosso IPC. O evento dispara depois de o
   * sistema ter terminado de restaurar, então `setBounds` aqui não corre contra
   * a animação.
   */
  mainWindow.on('unmaximize', () => {
    if (!janelaAntesDeMaximizar) return;
    mainWindow?.setBounds(janelaAntesDeMaximizar);
    janelaAntesDeMaximizar = null;
  });

  // Links externos abrem no browser do sistema, nunca dentro do app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    void mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---------------------------------------------------------------------------
// IPC (mockado no MVP - fica pronto para o backend/plugin real depois)
// ---------------------------------------------------------------------------
ipcMain.handle('app:get-version', () => app.getVersion());

ipcMain.handle('app:get-platform', () => process.platform);

ipcMain.handle('dialog:select-file', async (_e, filters?: Electron.FileFilter[]) => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters ?? [{ name: 'Builds', extensions: ['zip', 'exe', 'apk', 'dmg'] }],
  });
  return result.canceled ? null : result.filePaths[0];
});

/**
 * Atualização: o main apenas responde "existe versão nova?" e "abra o instalador".
 * A decisão fica na interface — o main nunca dispara um .exe por conta própria.
 */
ipcMain.handle('update:check', () => getAvailableUpdate());
ipcMain.handle('update:install', (_e, file: string) => runInstaller(file));

ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:toggle-maximize', () => {
  if (!mainWindow) return false;

  if (mainWindow.isMaximized()) {
    // Quem devolve o tamanho é o listener de `unmaximize`, logo acima.
    mainWindow.unmaximize();
    return false;
  }

  // Anota antes de maximizar: depois, `getBounds` já devolveria a tela inteira.
  janelaAntesDeMaximizar = mainWindow.getBounds();
  mainWindow.maximize();
  return true;
});
ipcMain.handle('window:close', () => mainWindow?.close());
ipcMain.handle('window:set-mode', (_e, modo: 'login' | 'app') => aplicarModo(modo));

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
