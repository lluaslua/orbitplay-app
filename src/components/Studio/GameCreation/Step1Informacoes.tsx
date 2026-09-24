import { Input } from '@/components/UI';
import {
  GAME_AGE_RATINGS,
  GAME_DEV_STAGES,
  GAME_ENGINES,
  GAME_LANGUAGES,
  GAME_MODES,
  GENRES,
  NEW_GAME_PLATFORMS,
} from '@/utils/constants';
import { DropdownOpcoes } from './DropdownOpcoes';
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
        <DropdownOpcoes
          label="Plataformas"
          required
          multiplo
          opcoes={NEW_GAME_PLATFORMS}
          valor={draft.platforms}
          onChange={(platforms) => onChange({ platforms })}
        />
        <DropdownOpcoes
          label="Modo de jogo"
          required
          opcoes={comoOpcoes(GAME_MODES)}
          valor={draft.gameMode}
          onChange={(gameMode) => onChange({ gameMode })}
        />
        <DropdownOpcoes
          label="Engine"
          opcoes={comoOpcoes(GAME_ENGINES)}
          valor={draft.engine}
          onChange={(engine) => onChange({ engine })}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <DropdownOpcoes
          label="Estágio de desenvolvimento"
          required
          opcoes={comoOpcoes(GAME_DEV_STAGES)}
          valor={draft.devStage}
          onChange={(devStage) => onChange({ devStage })}
        />
        <DropdownOpcoes
          label="Classificação indicativa"
          required
          opcoes={comoOpcoes(GAME_AGE_RATINGS)}
          valor={draft.ageRating}
          onChange={(ageRating) => onChange({ ageRating })}
        />
        <DropdownOpcoes
          label="Idiomas disponíveis"
          multiplo
          opcoes={GAME_LANGUAGES}
          valor={draft.languages}
          onChange={(languages) => onChange({ languages })}
        />
      </div>
    </div>
  );
}

function comoOpcoes(lista: readonly string[]) {
  return lista.map((item) => ({ valor: item, rotulo: item }));
}
