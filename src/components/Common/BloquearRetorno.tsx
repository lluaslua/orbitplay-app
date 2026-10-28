import { useEffect, useRef } from 'react';

/**
 * Segura o histórico enquanto há uma operação em andamento. A cópia da entrada
 * atual faz o voltar do navegador (mouse, touchpad e teclado) cair na própria
 * tela; em seguida ela volta à cópia mais recente.
 */
export function BloquearRetorno() {
  const entradaCriada = useRef(false);

  useEffect(() => {
    if (!entradaCriada.current) {
      window.history.pushState(null, '', window.location.href);
      entradaCriada.current = true;
    }

    const bloquear = () => window.history.go(1);
    window.addEventListener('popstate', bloquear);
    return () => window.removeEventListener('popstate', bloquear);
  }, []);

  return null;
}
