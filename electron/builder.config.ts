/**
 * Config do electron-builder em TS (fonte de verdade legivel).
 * O build real usa `electron-builder.yml` na raiz - mantenha os dois em sincronia
 * ou aponte o script para este arquivo com `electron-builder --config`.
 */
import type { Configuration } from 'electron-builder';

export const builderConfig: Configuration = {
  appId: 'com.orbitplay.desktop',
  productName: 'OrbitPlay',
  directories: { output: 'release', buildResources: 'build' },
  files: ['dist/**/*', 'dist-electron/**/*', 'package.json'],
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'build/icon.ico',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    shortcutName: 'OrbitPlay',
  },
  mac: {
    target: [{ target: 'dmg', arch: ['x64', 'arm64'] }],
    icon: 'build/icon.icns',
    category: 'public.app-category.developer-tools',
  },
  linux: { target: ['AppImage'], category: 'Development' },
};

export default builderConfig;
