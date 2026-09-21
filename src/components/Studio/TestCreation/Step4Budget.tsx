import { useEffect, useId } from 'react';
import { Checkbox, Radio, Switch } from '@/components/UI';
import { TrilhoCunha } from '@/components/Studio/TestCreation/TrilhoCunha';
import { calculateBudget, useTestStore } from '@/stores/testStore';
import type { ArchetypeId, PlayerTypeId, TestLocation } from '@/types';
import {
  ARCHETYPE_ICONS,
  ARCHETYPES,
  BOOST_CENTS,
  PLAYER_TYPE_ICONS,
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
 *
 * A etapa é uma pilha com 24px entre os blocos e as três linhas do arquivo
 * (`Line 187`, `188` e `189`): depois do cabeçalho, depois da Idade e antes do
 * Impulsione.
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
        <h2 className="text-headline leading-[normal] text-white">
          Público, Quantidade &amp; Duração
        </h2>
        <p className="text-body leading-[normal] text-white">
          Defina quem vai testar, por quanto tempo e quanto investir
        </p>
      </div>

      <hr className="border-orbit-dim" />

      <h3 className="text-subtitle leading-[normal] text-white">Público</h3>

      <Grupo titulo="Localização*">
        <div className="flex flex-wrap items-center gap-3">
          {TEST_LOCATIONS.map((local) => (
            <label key={local.id} className="flex cursor-pointer items-center gap-2 py-2">
              <Checkbox
                checked={audience.locations.includes(local.id)}
                onCheckedChange={() => alternarLocal(local.id)}
              />
              <span className="text-body leading-[normal] text-white">{local.label}</span>
            </label>
          ))}
        </div>
      </Grupo>

      <Grupo titulo="Tipo de jogador">
        <div className="flex gap-6">
          {PLAYER_TYPES.map((tipo) => (
            <CardEscolha
              key={tipo.id}
              icone={PLAYER_TYPE_ICONS[tipo.id]}
              nome={tipo.name}
              descricao={tipo.description}
              rodape={tipo.tier}
              selecionado={audience.playerType === tipo.id}
              onSelect={() => setAudience({ playerType: tipo.id as PlayerTypeId })}
              grupo="tipo-de-jogador"
            />
          ))}
        </div>
      </Grupo>

      <Grupo titulo="Arquétipos">
        <div className="flex gap-6">
          {ARCHETYPES.map((arquetipo) => (
            <CardEscolha
              key={arquetipo.id}
              icone={ARCHETYPE_ICONS[arquetipo.id]}
              nome={arquetipo.name}
              descricao={arquetipo.description}
              selecionado={audience.archetype === arquetipo.id}
              onSelect={() => setAudience({ archetype: arquetipo.id as ArchetypeId })}
              grupo="arquetipo"
            />
          ))}
        </div>
      </Grupo>

      <Grupo titulo="Idade">
        <TrilhoCunha
          min={16}
          max={99}
          value={[audience.minAge, audience.maxAge]}
          onValueChange={([minAge, maxAge]) => setAudience({ minAge, maxAge })}
          rotulos={['Idade mínima', 'Idade máxima']}
          formatar={(idade) => (idade >= 99 ? '99+' : String(idade))}
          rotuloInicio="16"
          rotuloFim="99+"
        />
      </Grupo>

      <hr className="border-orbit-dim" />

      <h3 className="text-subtitle leading-[normal] text-white">Quantidade &amp; Duração</h3>

      <Grupo titulo="Quantidade de teste">
        <div className="flex flex-wrap items-end gap-6">
          <TrilhoCunha
            min={1}
            max={1000}
            value={[budget.slots]}
            onValueChange={([slots]) => setBudget(calculateBudget({ ...budget, slots }))}
            rotulos={['Quantidade de teste']}
            formatar={formatNumber}
            rotuloInicio="1"
            rotuloFim="1.000"
            disabled={budget.untilDisabled}
          />

          <span className="text-body leading-[normal] text-white">Ou</span>

          <label className="flex cursor-pointer items-center gap-2">
            {/* Desligado, o trilho do arquivo é #C5C9CE (`342:2515`). */}
            <Switch
              checked={budget.untilDisabled}
              onCheckedChange={(checked) =>
                setBudget(calculateBudget({ ...budget, untilDisabled: checked }))
              }
              className="data-[state=unchecked]:bg-orbit-medium"
            />
            <span className="text-body-bold leading-[normal] text-white">
              Até desativar o teste*
            </span>
          </label>
        </div>
      </Grupo>

      <hr className="border-orbit-dim" />

      <CardImpulsionar
        ativo={budget.boostCents > 0}
        onToggle={(ativo) =>
          setBudget(calculateBudget({ ...budget, boostCents: ativo ? BOOST_CENTS : 0 }))
        }
      />
    </div>
  );
}

/** Rótulo Bold 16 e o conteúdo 4px abaixo — o `Input` de cada grupo do arquivo. */
function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const id = useId();

  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-1">
      <span id={id} className="text-body-bold leading-[normal] text-white">
        {titulo}
      </span>
      {children}
    </div>
  );
}

/**
 * Card de rádio do "Tipo de jogador" e dos "Arquétipos" — Figma `322:2311`.
 *
 * 300px de altura, borda de 2px (#E7E8E9, azul quando escolhido) e cantos de
 * 8. O rádio fica solto no canto; o conteúdo — ícone de 48, nome, descrição e
 * os cifrões em verde — fica centralizado no espaço que sobra.
 */
function CardEscolha({
  icone,
  nome,
  descricao,
  rodape,
  selecionado,
  onSelect,
  grupo,
}: {
  icone: string;
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
        // `rounded-lg` aqui é `var(--radius)` (12px); o card do arquivo tem 8.
        'relative flex min-h-[300px] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center rounded-[8px] border-2 px-4 pb-4 pt-8 text-center',
        selecionado ? 'border-orbit-blue' : 'border-orbit-dim',
      )}
    >
      <Radio
        name={grupo}
        checked={selecionado}
        onChange={onSelect}
        aria-label={nome}
        className="absolute left-1.5 top-[9px]"
      />

      <span className="flex w-full flex-col items-center gap-1">
        <img src={`./icons/figma/${icone}.svg`} alt="" className="size-12" />
        <span className="text-body-bold leading-[normal] text-white">{nome}</span>
        <span className="text-body leading-[normal] text-white">{descricao}</span>
        {rodape && (
          <span className="text-body-bold leading-[normal] text-orbit-success-l">{rodape}</span>
        )}
      </span>
    </label>
  );
}

/** As cinco vantagens do impulso, com os ícones amarelos do arquivo (`347:2553`). */
const VANTAGENS_IMPULSO = [
  {
    icone: 'impulso/estrela',
    texto: 'Destaque visual na grade do teste com borda, selo e maior contraste',
  },
  { icone: 'impulso/tag', texto: 'Tag adicional na Home para capturar mais interesse' },
  { icone: 'impulso/local', texto: 'Posicionamento prioritário para novos testers' },
  { icone: 'impulso/olho', texto: 'Mais visibilidade, atrai mais jogadores variados' },
  { icone: 'impulso/presente', texto: 'Maior incentivo direto aos jogadores' },
];

/**
 * Card "Impulsione seu teste" — Figma `347:2532`.
 *
 * O roxo sobe do rodapé e some antes do meio (4,41°, do arquivo). À esquerda
 * vai a ilustração do card em destaque (grupo `347:2711`, exportado como
 * imagem); à direita, o texto, as vantagens e o switch, que ligado fica
 * amarelo (`G-Topaz`). Abaixo do breakpoint `figma` as duas colunas empilham:
 * a ilustração tem 511px e não sobra lugar para o texto ao lado.
 */
function CardImpulsionar({
  ativo,
  onToggle,
}: {
  ativo: boolean;
  onToggle: (ativo: boolean) => void;
}) {
  return (
    <section
      className="flex flex-col gap-6 rounded-3xl border border-orbit-purple p-6"
      style={{
        backgroundImage:
          'linear-gradient(4.41deg, rgba(144, 96, 239, 0.8) 7.193%, rgba(144, 96, 239, 0) 56.051%)',
      }}
    >
      <div className="flex flex-col gap-2">
        <h3 className="flex items-center gap-1 text-headline-mobile leading-[normal] text-white">
          <img src="./icons/figma/impulso/foguete.svg" alt="" className="size-6 shrink-0" />
          Impulsione seu teste
        </h3>
        <p className="text-subtitle leading-[normal] text-white">
          Destaque seu teste na plataforma e acelere a demonstrar valor com mais visibilidade,
          engajamento e respostas qualificadas.
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 figma:flex-row figma:items-start figma:justify-center">
        <img
          src="./images/impulso/destaque.webp"
          alt="Prévia de um teste em destaque na grade, com o selo Em destaque"
          className="h-auto w-[511px] max-w-full shrink-0"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <p className="text-body leading-[normal] text-white">
            Ao <strong>impulsionar</strong> seu teste, ele ganha <strong>prioridade visual</strong> e{' '}
            <strong>estratégica</strong> dentro da OrbitPlay, aumentando a <strong>taxa</strong> de
            participação e a qualidade dos insights coletados.
          </p>

          <ul className="flex flex-col gap-2">
            {VANTAGENS_IMPULSO.map(({ icone, texto }) => (
              <li key={texto} className="flex items-center gap-2 text-body leading-[normal] text-white">
                <img src={`./icons/figma/${icone}.svg`} alt="" className="size-6 shrink-0" />
                {texto}
              </li>
            ))}
          </ul>

          <p className="text-subtitle leading-[normal] text-white">
            Acelere seu teste e colete insights de qualidade em menos tempo!
          </p>

          <label className="flex cursor-pointer items-center justify-end gap-2">
            <span className="text-body-bold leading-[normal] text-white">Impulsionar teste!</span>
            <span className="text-body-bold leading-[normal] text-white">
              + R$ {formatAmount(BOOST_CENTS)}/teste
            </span>
            <Switch
              checked={ativo}
              onCheckedChange={onToggle}
              className="data-[state=checked]:bg-orbit-g-topaz data-[state=unchecked]:bg-orbit-medium"
            />
          </label>
        </div>
      </div>
    </section>
  );
}
