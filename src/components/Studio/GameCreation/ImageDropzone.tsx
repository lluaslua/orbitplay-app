import { useRef, useState, type DragEvent } from 'react';
import { Upload } from 'lucide-react';
import { Button, FieldError } from '@/components/UI';
import { cn } from '@/utils/helpers';
import { reduzirImagem } from '@/utils/imagem';

/**
 * Uma das três caixas de "Imagens e mídias" (etapa 2 de Novo jogo): capa, logo
 * e ícone/thumbnail. Mesma área de arrastar-e-soltar do upload de build
 * (`Step3UploadBuild`), só que recebe imagem em vez de executável e mostra
 * a prévia depois de enviada, como as imagens de pergunta do Novo teste.
 */
export function ImageDropzone({
  label,
  required,
  hint,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  hint: string;
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function receber(arquivo: File | undefined) {
    if (!arquivo) return;
    try {
      onChange(await reduzirImagem(arquivo));
      setErro(null);
    } catch {
      setErro('Não foi possível abrir essa imagem. Use JPG, PNG ou WebP.');
    }
  }

  function soltar(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    receber(evento.dataTransfer.files[0]);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div>
        <p className="text-body-bold text-white">
          {label}
          {required && '*'}
        </p>
        <p className="text-caption text-orbit-muted">{hint}</p>
      </div>

      <div
        onDragOver={(evento) => evento.preventDefault()}
        onDrop={soltar}
        className={cn(
          'flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-white p-6',
        )}
      >
        {value ? (
          <>
            <img src={value} alt="" className="max-h-32 w-full rounded-lg object-contain" />
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-button text-orbit-blue hover:underline"
              >
                Trocar
              </button>
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className="text-button text-orbit-error-l hover:underline"
              >
                Remover
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="grid size-14 place-items-center rounded-xl bg-orbit-nightfall">
              <Upload className="size-6 text-white" />
            </span>

            <div className="text-center">
              <p className="text-body-bold text-white">Arraste e solte a sua Imagem aqui</p>
              <p className="text-caption text-orbit-muted">
                Tipos de arquivo aceitos (.jpg, .png, .webp)
              </p>
            </div>

            <Button variant="nightfall" size="md" onClick={() => inputRef.current?.click()}>
              Importar
              <Upload className="size-5" />
            </Button>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(evento) => receber(evento.target.files?.[0])}
        />
      </div>

      {erro && <FieldError message={erro} />}
    </div>
  );
}
