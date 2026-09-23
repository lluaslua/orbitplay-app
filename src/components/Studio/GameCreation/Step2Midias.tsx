import { Input } from '@/components/UI';
import { ImageDropzone } from './ImageDropzone';
import type { NovoJogoDraft } from './useNovoJogoDraft';

/**
 * ETAPA 2 de "Novo jogo" — Imagens e mídias.
 *
 * Três caixas lado a lado (capa, logo, ícone/thumbnail) e o campo de URL do
 * trailer, na mesma ordem e legendas do print da tela.
 */
export function Step2Midias({
  draft,
  onChange,
}: {
  draft: NovoJogoDraft;
  onChange: (patch: Partial<NovoJogoDraft>) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-headline text-white">Imagens e mídias</h2>
        <p className="text-body text-white">
          Adicione os materiais que serão utilizados na apresentação e identificação do jogo
          dentro da plataforma.
        </p>
      </div>

      <div className="flex flex-col gap-6 min-[900px]:flex-row">
        <ImageDropzone
          label="Imagem de capa"
          required
          hint="Imagem principal utilizada nos cards e página do projeto. 16:9"
          value={draft.coverUrl}
          onChange={(coverUrl) => onChange({ coverUrl })}
        />
        <ImageDropzone
          label="Logo"
          required
          hint="Preferencialmente PNG com fundo transparente."
          value={draft.logoUrl}
          onChange={(logoUrl) => onChange({ logoUrl })}
        />
        <ImageDropzone
          label="Ícone / thumbnail"
          required
          hint="Imagem quadrada utilizada em menus, listas e dashboards."
          value={draft.iconUrl}
          onChange={(iconUrl) => onChange({ iconUrl })}
        />
      </div>

      <Input
        label="Trailer / vídeo"
        placeholder="Digite a URL do vídeo..."
        value={draft.trailerUrl}
        onChange={(event) => onChange({ trailerUrl: event.target.value })}
      />
    </div>
  );
}
