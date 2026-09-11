import { useTestStore } from '@/stores/testStore';
import type { TestModelInfo } from '@/types';
import { TEST_MODELS } from '@/utils/constants';
import { cn, formatAmount } from '@/utils/helpers';
import { Radio } from '@/components/UI';

/**
 * ETAPA 1 — Tipo de teste. Figma: `317:2262`, cards `318:6534` e seguintes.
 *
 * Quatro cards de 414px lado a lado, todos com a mesma estrutura: cabeçalho,
 * frase de efeito, descrição, lista do que entrega, preço e o rádio.
 *
 * O card recomendado é o único que foge do padrão — ganha borda laranja, um
 * degradê que sobe do rodapé, o lockup do OrbitPlug-in e o selo "Recomendado!"
 * pendurado acima da borda superior.
 */
export function Step1SelectModel() {
  const model = useTestStore((state) => state.draft.model);
  const setModel = useTestStore((state) => state.setModel);
  const exigePlugin = TEST_MODELS.some((item) => item.requiresPlugin);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-headline text-white">Tipo de teste</h2>
        <p className="text-body text-white">
          Escolha o formato ideal para validar sua hipótese: dados quantitativos, feedback
          qualitativo, comparação A/B ou exploração livre do jogo.
        </p>
      </div>

      <div className="flex items-stretch gap-6">
        {TEST_MODELS.map((modelo) => (
          <CardModelo
            key={modelo.id}
            modelo={modelo}
            selecionado={model === modelo.id}
            onSelect={() => setModel(modelo.id)}
          />
        ))}
      </div>

      {exigePlugin && (
        <p className="text-caption text-orbit-orange">
          Requer: Build integrada com o Orbit Plug-in de Telemetria da OrbitPlay.{' '}
          <a href="#plugin" className="underline">
            Saiba mais.
          </a>
        </p>
      )}
    </div>
  );
}

function CardModelo({
  modelo,
  selecionado,
  onSelect,
}: {
  modelo: TestModelInfo;
  selecionado: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        'relative flex flex-1 cursor-pointer flex-col items-center gap-6 rounded-3xl border p-6 transition-shadow',
        modelo.recommended
          ? 'border-orbit-orange bg-orbit-recommended'
          : 'border-white bg-transparent',
        selecionado && 'ring-2 ring-orbit-blue',
      )}
    >
      {modelo.recommended && (
        <span className="absolute -top-5 left-6 bg-orbit-flame-text bg-clip-text text-subtitle font-bold italic text-transparent">
          Recomendado!
        </span>
      )}

      <span className="flex w-full items-center justify-center gap-1">
        <img src={`./icons/figma/model/${modelo.icon}.svg`} alt="" className="size-6 shrink-0" />
        <span className="text-headline-mobile text-white">{modelo.name}</span>
      </span>

      {modelo.requiresPlugin && <LockupPlugin />}

      <p className="w-full text-center text-subtitle text-white">{modelo.tagline}</p>

      <p className="w-full text-body text-white">{modelo.description}</p>

      <div className="flex w-full flex-1 flex-col items-start gap-2">
        <p className="text-body text-white">{modelo.deliversTitle}</p>

        {modelo.delivers.map((item, indice) => (
          <span key={item} className="flex w-full items-center gap-2">
            <img
              src={`./icons/figma/model/${modelo.icon}-${indice + 1}.svg`}
              alt=""
              className="size-6 shrink-0"
            />
            <span className="flex-1 text-body text-white">{item}</span>
          </span>
        ))}
      </div>

      <span className="flex w-full flex-col items-center justify-center gap-1 whitespace-nowrap text-white">
        <span className="font-label font-bold">
          <span className="text-[16px] font-normal">R$</span>
          <span className="text-[34px]">{formatAmount(modelo.pricePerTestCents)}</span>
        </span>
        <span className="font-label text-[16px] font-light">Por teste</span>
      </span>

      <Radio
        name="modelo-de-teste"
        checked={selecionado}
        onChange={onSelect}
        aria-label={modelo.name}
              />
    </label>
  );
}

/**
 * Lockup do OrbitPlug-in do card recomendado: traço · marca · traço, com a
 * elipse por trás.
 *
 * No Figma ele tem 395,87px dentro de um card de 414 — ou seja, é mais largo
 * que a área útil e invade o padding de 24. Daí o `-mx-6`: sem isso o nome
 * quebra em duas linhas. Os traços encolhem, o miolo nunca.
 */
function LockupPlugin() {
  return (
    <span className="relative -mx-6 flex w-[calc(100%+48px)] shrink-0 items-center justify-center">
      <img
        src="./icons/figma/plugin-ellipse.svg"
        alt=""
        className="pointer-events-none absolute h-[28.411px] w-[334.292px]"
      />
      <img src="./icons/figma/plugin-line-left.svg" alt="" className="relative min-w-0 flex-1" />

      <span className="relative mx-2 flex shrink-0 items-center gap-1 whitespace-nowrap">
        <span className="relative">
          <img src="./icons/figma/plugin-mark.svg" alt="" className="size-[32.4px]" />
          <img
            src="./icons/figma/plugin-sparkle.svg"
            alt=""
            className="absolute left-[18.9px] top-[3.06px] h-[15.12px] w-[16.2px]"
          />
        </span>
        <span className="text-[25.92px] text-white">
          <strong className="font-bold">Orbit</strong>
          <span className="font-normal">Plug-in</span>
        </span>
      </span>

      <img src="./icons/figma/plugin-line-right.svg" alt="" className="relative min-w-0 flex-1" />
    </span>
  );
}
