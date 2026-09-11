import { useEffect } from 'react';
import { Checkbox, Radio, Switch } from '@/components/UI';
import { calculateBudget, useTestStore } from '@/stores/testStore';
import type { ArchetypeId, PlayerTypeId, TestLocation } from '@/types';
import {
  ARCHETYPES,
  BOOST_CENTS,
  PLAYER_TYPES,
  TEST_LOCATIONS,
  TEST_MODELS,
} from '@/utils/constants';
import { cn, formatAmount, formatNumber } from '@/utils/helpers';

/**
 * ETAPA 4 — Público, Quantidade & Duração. Figma: `319:9516`.
 *
 * O preço por teste é montado aqui: modelo escolhido na etapa 1, mais o
 * adicional do perfil de jogador, mais o impulsionamento. O resumo com o total
 * fica na coluna da direita, na casca do fluxo.
 */
export function Step4Budget() {
  const draft = useTestStore((state) => state.draft);
  const setAudience = useTestStore((state) => state.setAudience);
  const setBudget = useTestStore((state) => state.setBudget);

  const { audience, budget } = draft;
  const modelo = TEST_MODELS.find((item) => item.id === draft.model);
  const perfil = PLAYER_TYPES.find((item) => item.id === audience.playerType);

  const base = modelo?.pricePerTestCents ?? 0;
  const adicionalPerfil = perfil?.extraCents ?? 0;

  // O preço acompanha as escolhas das etapas anteriores sem o usuário reabrir nada.
  useEffect(() => {
    if (budget.basePriceCents !== base || budget.audienceCents !== adicionalPerfil) {
      setBudget(calculateBudget({ ...budget, basePriceCents: base, audienceCents: adicionalPerfil }));
    }
  }, [base, adicionalPerfil, budget, setBudget]);

  function alternarLocal(local: TestLocation) {
    const atuais = audience.locations;
    setAudience({
      locations: atuais.includes(local)
        ? atuais.filter((item) => item !== local)
        : [...atuais, local],
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-headline text-white">Público, Quantidade &amp; Duração</h2>
        <p className="text-body text-white">
          Defina quem vai testar, por quanto tempo e quanto investir
        </p>
      </div>

      <h3 className="text-subtitle text-white">Público</h3>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-body-bold text-white">Localização*</legend>
        <div className="flex flex-wrap items-center gap-6">
          {TEST_LOCATIONS.map((local) => (
            <label key={local.id} className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={audience.locations.includes(local.id)}
                onCheckedChange={() => alternarLocal(local.id)}
              />
              <span className="text-body text-white">{local.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Grupo titulo="Tipo de jogador">
        {PLAYER_TYPES.map((tipo) => (
          <CardEscolha
            key={tipo.id}
            nome={tipo.name}
            descricao={tipo.description}
            rodape={tipo.tier}
            selecionado={audience.playerType === tipo.id}
            onSelect={() => setAudience({ playerType: tipo.id as PlayerTypeId })}
            grupo="tipo-de-jogador"
          />
        ))}
      </Grupo>

      <Grupo titulo="Arquétipos">
        {ARCHETYPES.map((arquetipo) => (
          <CardEscolha
            key={arquetipo.id}
            nome={arquetipo.name}
            descricao={arquetipo.description}
            selecionado={audience.archetype === arquetipo.id}
            onSelect={() => setAudience({ archetype: arquetipo.id as ArchetypeId })}
            grupo="arquetipo"
          />
        ))}
      </Grupo>

      {/* Idade */}
      <div className="flex flex-col gap-2">
        <span className="text-body-bold text-white">Idade</span>
        <div className="flex items-center gap-3">
          <span className="text-caption text-white">16</span>
          <input
            type="range"
            min={16}
            max={99}
            value={audience.minAge}
            onChange={(evento) =>
              setAudience({ minAge: Math.min(Number(evento.target.value), audience.maxAge - 1) })
            }
            className="flex-1 accent-orbit-blue"
            aria-label="Idade mínima"
          />
          <span className="w-10 text-center text-caption text-white">{audience.minAge}</span>
          <input
            type="range"
            min={16}
            max={99}
            value={audience.maxAge}
            onChange={(evento) =>
              setAudience({ maxAge: Math.max(Number(evento.target.value), audience.minAge + 1) })
            }
            className="flex-1 accent-orbit-blue"
            aria-label="Idade máxima"
          />
          <span className="text-caption text-white">{audience.maxAge}</span>
          <span className="text-caption text-white">99+</span>
        </div>
      </div>

      <h3 className="text-subtitle text-white">Quantidade &amp; Duração</h3>

      <div className="flex flex-col gap-2">
        <span className="text-body-bold text-white">Quantidade de teste</span>
        <div className="flex items-center gap-3">
          <span className="text-caption text-white">1</span>
          <input
            type="range"
            min={1}
            max={1000}
            value={budget.slots}
            disabled={budget.untilDisabled}
            onChange={(evento) =>
              setBudget(calculateBudget({ ...budget, slots: Number(evento.target.value) }))
            }
            className="flex-1 accent-orbit-blue disabled:opacity-40"
            aria-label="Quantidade de teste"
          />
          <span className="w-14 text-center text-caption text-white">
            {formatNumber(budget.slots)}
          </span>
          <span className="text-caption text-white">1.000</span>

          <span className="text-body text-white">Ou</span>
          <label className="flex cursor-pointer items-center gap-2">
            <Switch
              checked={budget.untilDisabled}
              onCheckedChange={(checked) =>
                setBudget(calculateBudget({ ...budget, untilDisabled: checked }))
              }
            />
            <span className="text-body text-white">Até desativar o teste*</span>
          </label>
        </div>
      </div>

      <CardImpulsionar
        ativo={budget.boostCents > 0}
        onToggle={(ativo) =>
          setBudget(calculateBudget({ ...budget, boostCents: ativo ? BOOST_CENTS : 0 }))
        }
      />
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-body-bold text-white">{titulo}</legend>
      <div className="flex items-stretch gap-6">{children}</div>
    </fieldset>
  );
}

/** Card de rádio do "Tipo de jogador" e dos "Arquétipos". */
function CardEscolha({
  nome,
  descricao,
  rodape,
  selecionado,
  onSelect,
  grupo,
}: {
  nome: string;
  descricao: string;
  rodape?: string;
  selecionado: boolean;
  onSelect: () => void;
  grupo: string;
}) {
  return (
    <label
      className={cn(
        'flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-2xl border p-4 text-center',
        selecionado ? 'border-orbit-blue' : 'border-orbit-border',
      )}
    >
      <Radio
        name={grupo}
        checked={selecionado}
        onChange={onSelect}
        aria-label={nome}
              />
      <span className="text-body-bold text-white">{nome}</span>
      <span className="text-caption text-orbit-dim">{descricao}</span>
      {rodape && <span className="mt-auto text-body-bold text-orbit-blue">{rodape}</span>}
    </label>
  );
}

/** Card roxo "Impulsione seu teste". */
const VANTAGENS_IMPULSO = [
  'Destaque visual na grade do teste com borda, selo e maior contraste',
  'Tag adicional na Home para capturar mais interesse',
  'Posicionamento prioritário para novos testers',
  'Mais visibilidade, atrai mais jogadores variados',
  'Maior incentivo direto aos jogadores',
];

function CardImpulsionar({
  ativo,
  onToggle,
}: {
  ativo: boolean;
  onToggle: (ativo: boolean) => void;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-orbit-purple bg-orbit-nightfall/20 p-6">
      <h3 className="text-subtitle font-bold text-white">Impulsione seu teste</h3>
      <p className="text-body text-white">
        Destaque seu teste na plataforma e acelere a demonstrar valor com mais visibilidade,
        engajamento e respostas qualificadas.
      </p>

      <p className="text-body text-white">
        Ao <strong>impulsionar</strong> seu teste, ele ganha <strong>prioridade visual</strong> e{' '}
        <strong>estratégica</strong> dentro da OrbitPlay, aumentando a <strong>taxa</strong> de
        participação e a qualidade dos insights coletados.
      </p>

      <ul className="flex flex-col gap-2">
        {VANTAGENS_IMPULSO.map((vantagem) => (
          <li key={vantagem} className="flex items-center gap-2 text-body text-white">
            <img src="./icons/figma/model/telemetry-2.svg" alt="" className="size-6 shrink-0" />
            {vantagem}
          </li>
        ))}
      </ul>

      <p className="text-body text-white">
        Acelere seu teste e colete insights de qualidade em menos tempo!
      </p>

      <label className="flex cursor-pointer items-center justify-end gap-2">
        <span className="text-body-bold text-white">
          Impulsionar teste! + R$ {formatAmount(BOOST_CENTS)}/teste
        </span>
        <Switch checked={ativo} onCheckedChange={onToggle} />
      </label>
    </section>
  );
}
