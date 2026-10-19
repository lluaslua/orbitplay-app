import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { queryClient } from '@/lib/queryClient';
import { configureApi, definirPlataforma } from '@/lib/api';
import { startMockServer } from '@/mocks/server';
import './styles/globals.css';
import './App.css';

/**
 * Boot: decide quem responde as requisicoes antes de montar o React.
 *  - browser + service worker disponivel -> MSW
 *  - Electron (file://) ou fallback       -> adapter mock do axios
 */
async function bootstrap() {
  const mswActive = await startMockServer();
  configureApi(mswActive);
  // No app desktop a API sabe em que sistema o tester joga (teste incompatível fica indisponível).
  if (window.orbit) definirPlataforma(await window.orbit.getPlatform());

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

void bootstrap();
