import { Input, SelectField } from '@/components/UI';
import {
  GAME_AGE_RATINGS,
  GAME_DEV_STAGES,
  GAME_ENGINES,
  GAME_LANGUAGES,
  GAME_MODES,
  GENRES,
  PLATFORMS,
} from '@/utils/constants';
import { GenreMultiSelect } from './GenreMultiSelect';
import type { NovoJogoDraft } from './useNovoJogoDraft';

/**
 * ETAPA 1 de "Novo jogo" — Informações gerais.
 *
 * Nome, subtítulo, descrição curta; gênero e sub-gênero em chips buscáveis;
 * e a fileira final de seletores (plataformas, modo de jogo, engine, estágio
 * de desenvolvimento, classificação indicativa e idiomas).
 */
export function Step1Informacoes({
  draft,
  onChange,
}: {
  draft: NovoJogoDraft;
  onChange: (patch: Partial<NovoJogoDraft>) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-headline text-white">Informações gerais</h2>
        <p className="text-body text-white">
          Cadastre os dados principais que identificarão o projeto dentro da OrbitPlay.
        </p>
      </div>

      <hr className="border-orbit-border" />

      <div className="grid grid-cols-3 gap-6">
        <Input
          label="Nome do jogo"
          required
          placeholder="Digite..."
          value={draft.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
        <Input
          label="Subtítulo / tagline"
          required
          placeholder="Digite... Ex: Strategic battles beyond the end of the world."
          value={draft.tagline}
          onChange={(event) => onChange({ tagline: event.target.value })}
        />
        <Input
          label="Descrição curta"
          required
          placeholder="Digite..."
          value={draft.shortDescription}
          onChange={(event) => onChange({ shortDescription: event.target.value })}
        />
      </div>

      <GenreMultiSelect
        label="Gênero"
        required
        options={GENRES}
        selected={draft.genres}
        onChange={(genres) => onChange({ genres })}
      />

      <GenreMultiSelect
        label="Sub-Gênero"
        options={GENRES}
        selected={draft.subGenres}
        onChange={(subGenres) => onChange({ subGenres })}
      />

      <div className="grid grid-cols-3 gap-6">
        <SelectField
          label="Plataformas"
          required
          value={draft.platform}
          onChange={(event) => onChange({ platform: event.target.value })}
        >
          <option value="" className="bg-orbit-bg">Selecione...</option>
          {PLATFORMS.map((item) => (
            <option key={item} value={item} className="bg-orbit-bg">
              {item}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Modo de jogo"
          required
          value={draft.gameMode}
          onChange={(event) => onChange({ gameMode: event.target.value })}
        >
          <option value="" className="bg-orbit-bg">Selecione...</option>
          {GAME_MODES.map((item) => (
            <option key={item} value={item} className="bg-orbit-bg">
              {item}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Engine"
          value={draft.engine}
          onChange={(event) => onChange({ engine: event.target.value })}
        >
          <option value="" className="bg-orbit-bg">Selecione...</option>
          {GAME_ENGINES.map((item) => (
            <option key={item} value={item} className="bg-orbit-bg">
              {item}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <SelectField
          label="Estágio de desenvolvimento"
          required
          value={draft.devStage}
          onChange={(event) => onChange({ devStage: event.target.value })}
        >
          <option value="" className="bg-orbit-bg">Selecione...</option>
          {GAME_DEV_STAGES.map((item) => (
            <option key={item} value={item} className="bg-orbit-bg">
              {item}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Classificação indicativa"
          required
          value={draft.ageRating}
          onChange={(event) => onChange({ ageRating: event.target.value })}
        >
          <option value="" className="bg-orbit-bg">Selecione...</option>
          {GAME_AGE_RATINGS.map((item) => (
            <option key={item} value={item} className="bg-orbit-bg">
              {item}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Idiomas disponíveis"
          value={draft.language}
          onChange={(event) => onChange({ language: event.target.value })}
        >
          <option value="" className="bg-orbit-bg">Selecione...</option>
          {GAME_LANGUAGES.map((item) => (
            <option key={item} value={item} className="bg-orbit-bg">
              {item}
            </option>
          ))}
        </SelectField>
      </div>
    </div>
  );
}
