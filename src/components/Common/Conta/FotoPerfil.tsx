import { useEffect, useRef, useState, type DragEvent } from 'react';
import { FolderUp, Upload } from 'lucide-react';
import { cn, initials } from '@/utils/helpers';

/** Os tipos e o tamanho que o `POST /me/avatar` aceita. */
export const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
export const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024;

/** Por que a foto não serve, ou `null` quando serve. */
export function problemaDaFoto(arquivo: File): string | null {
  if (!TIPOS_FOTO.includes(arquivo.type)) return 'Use uma imagem JPG, PNG ou WebP.';
  if (arquivo.size > TAMANHO_MAXIMO_FOTO) return 'A imagem passa de 5 MB.';
  return null;
}

/**
 * A foto da Minha conta: o círculo com o anel roxo→azul e, ao lado, a área
 * "Imagem de perfil" de arrastar e soltar com o botão "Importar". A foto
 * escolhida aparece no círculo na hora e só sobe no "Salvar".
 */
export function FotoPerfil({
  nome,
  fotoAtual,
  arquivo,
  onArquivo,
}: {
  nome: string;
  fotoAtual?: string;
  arquivo: File | null;
  onArquivo: (arquivo: File) => void;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // A prévia é um blob em memória: sai quando o arquivo muda ou a tela fecha.
  useEffect(() => {
    if (!arquivo) return setPrevia(null);
    const url = URL.createObjectURL(arquivo);
    setPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  function receber(escolhido: File | undefined) {
    if (!escolhido) return;
    const problema = problemaDaFoto(escolhido);
    setErro(problema);
    if (!problema) onArquivo(escolhido);
  }

  function soltar(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    receber(evento.dataTransfer.files[0]);
  }

  const foto = previa ?? fotoAtual;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <span className="grid size-[200px] shrink-0 place-items-center rounded-full bg-orbit-nightfall-tile p-1.5">
        {foto ? (
          <img src={foto} alt="Foto de perfil" className="size-full rounded-full bg-orbit-bg object-cover" />
        ) : (
          <span className="grid size-full place-items-center rounded-full bg-orbit-bg text-display-md text-white">
            {initials(nome)}
          </span>
        )}
      </span>

      <div className="flex w-[420px] max-w-full flex-col gap-1">
        <p className="font-label text-title-s text-white">Imagem de perfil</p>
        <div
          onDragOver={(evento) => evento.preventDefault()}
          onDrop={soltar}
          className={cn(
            'flex h-[190px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 text-center',
            erro ? 'border-orbit-error-l' : 'border-white/70',
          )}
        >
          <FolderUp className="size-10 text-orbit-blue" aria-hidden />
          <p className="text-caption-bold text-white">Arraste e solte a sua imagem aqui</p>
          <p className="text-caption text-orbit-muted">{erro ?? 'Tipos de arquivo aceitos (.jpg, .png, .webp)'}</p>
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            className="mt-2 flex h-9 items-center gap-2 rounded-lg bg-orbit-action-wide px-6 text-caption-bold text-white shadow-bevel orbit-focus-ring"
          >
            Importar
            <Upload className="size-4" />
          </button>
          <input
            ref={entrada}
            type="file"
            accept={TIPOS_FOTO.join(',')}
            className="hidden"
            onChange={(evento) => {
              receber(evento.target.files?.[0]);
              // Deixa escolher o mesmo arquivo de novo depois de um erro.
              evento.target.value = '';
            }}
          />
        </div>
      </div>
    </div>
  );
}
