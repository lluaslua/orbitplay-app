import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/UI';
import { isElectron } from '@/utils/helpers';

interface Update {
  version: string;
  file: string;
}

/**
 * Faixa de atualização.
 *
 * Aparece quando `~/OrbitPlayFeed/latest.json` aponta para uma versão maior que
 * a instalada. A instalação só começa com um clique daqui — o processo main
 * nunca abre o instalador sozinho (ver o comentário em `electron/updater.ts`
 * sobre o diálogo nativo que se auto-respondia).
 *
 * No browser não aparece: não há o que atualizar.
 */
export function UpdateBanner() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isElectron()) return;
    let active = true;

    void window.orbit?.update
      .check()
      .then((found) => {
        if (active) setUpdate(found);
      })
      .catch(() => {
        // Falha ao checar não merece interromper ninguém: some silenciosamente.
      });

    return () => {
      active = false;
    };
  }, []);

  if (!update || dismissed) return null;

  async function install() {
    if (!update) return;
    setInstalling(true);
    setError(null);

    const failure = await window.orbit?.update.install(update.file);
    if (failure) {
      setError(failure);
      setInstalling(false);
    }
    // Em caso de sucesso o app encerra sozinho; não há o que fazer aqui.
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-orbit-orange/40 bg-orbit-orange/15 px-6 py-3">
      <Download className="size-5 shrink-0 text-orbit-orange" />

      <p className="min-w-0 flex-1 text-graphic text-white">
        <strong className="font-bold">Versão {update.version} disponível.</strong>{' '}
        {error ? (
          <span className="text-orbit-error-l">{error}</span>
        ) : (
          'Ao atualizar, o OrbitPlay fecha e o instalador abre.'
        )}
      </p>

      <Button size="sm" onClick={install} loading={installing}>
        {installing ? 'Abrindo instalador...' : 'Atualizar agora'}
      </Button>

      <Button
        size="sm"
        variant="tertiary"
        iconOnly
        aria-label="Dispensar"
        onClick={() => setDismissed(true)}
      >
        <X />
      </Button>
    </div>
  );
}
