import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/utils/helpers';

/**
 * Trilho em cunha dos sliders da etapa 4 — Figma `322:5922` (Idade) e
 * `324:5962` (Quantidade de teste), que são o mesmo desenho.
 *
 * O trilho não é uma barra: é o vetor `Base` do arquivo, uma cunha que nasce
 * com ~4px à esquerda e termina com 16px e ponta redonda
 * (`trilho/cunha.svg`, exportado do nó `322:5924`). As cores entram por baixo
 * dessa silhueta, como máscara. Com dois grabbers (Idade), o que fica fora da
 * faixa escolhida é vermelho e o de dentro é azul; com um só (Quantidade), é
 * tudo azul.
 *
 * Arraste, clique no trilho e teclado vêm do Radix Slider. O `Range` dele não
 * é usado porque não conhece a cunha. O grabber é o do arquivo (`322:5928`):
 * 18px azuis com contorno branco de 4px por fora, ou seja, 26px de caixa.
 *
 * A escala é linear: cada valor ocupa o mesmo espaço. As posições do desenho
 * (o 20 a 100px e o 78 a 508px) não seguem escala nenhuma, e o Luan preferiu a
 * linear a copiar essas posições.
 */
const LARGURA = 559;
const GRABBER = 26;

const VERMELHO = '#FB3748'; // Systems/S-Error Light
const AZUL = '#248FF7'; // Brand/B-Blue

const CUNHA = 'url(./icons/figma/trilho/cunha.svg)';

/** Centro do grabber, em px. É a mesma conta do Radix para manter o grabber dentro do trilho. */
function centro(valor: number, min: number, max: number) {
  const fracao = max === min ? 0 : (valor - min) / (max - min);
  return GRABBER / 2 + fracao * (LARGURA - GRABBER);
}

export function TrilhoCunha({
  min,
  max,
  value,
  onValueChange,
  rotulos,
  formatar = String,
  rotuloInicio,
  rotuloFim,
  disabled,
}: {
  min: number;
  max: number;
  value: number[];
  onValueChange: (valor: number[]) => void;
  /** `aria-label` de cada grabber, na ordem de `value`. */
  rotulos: string[];
  /** Texto do valor em cima do grabber. */
  formatar?: (valor: number) => string;
  rotuloInicio: string;
  rotuloFim: string;
  disabled?: boolean;
}) {
  const faixa = value.length > 1;
  const inicio = centro(value[0], min, max);
  const fim = centro(value[value.length - 1], min, max);

  const cores = faixa
    ? `linear-gradient(90deg, ${VERMELHO} ${inicio}px, ${AZUL} ${inicio}px, ${AZUL} ${fim}px, ${VERMELHO} ${fim}px)`
    : AZUL;

  return (
    <div className={cn('flex items-end gap-1', disabled && 'opacity-40')}>
      <Ponta>{rotuloInicio}</Ponta>

      <SliderPrimitive.Root
        min={min}
        max={max}
        step={1}
        value={value}
        onValueChange={onValueChange}
        minStepsBetweenThumbs={1}
        disabled={disabled}
        className="relative flex h-[49px] w-[559px] shrink-0 touch-none select-none items-start"
      >
        {/* Trilho de 16px no y 27 do quadro de 49, como no arquivo. */}
        <SliderPrimitive.Track
          className="absolute inset-x-0 top-[27px] h-4"
          style={{
            background: cores,
            WebkitMaskImage: CUNHA,
            maskImage: CUNHA,
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
          }}
        />

        {value.map((valor, indice) => (
          <SliderPrimitive.Thumb
            key={indice}
            aria-label={rotulos[indice]}
            aria-valuetext={formatar(valor)}
            // 22px de cima: o centro do grabber cai no centro do trilho (y 35).
            className="relative mt-[22px] block size-[26px] rounded-full orbit-focus-ring"
          >
            <img
              src="./icons/figma/trilho/grabber.svg"
              alt=""
              draggable={false}
              className="size-full"
            />
            <span className="pointer-events-none absolute left-1/2 top-[-22px] -translate-x-1/2 whitespace-nowrap text-body leading-5 text-white">
              {formatar(valor)}
            </span>
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Root>

      <Ponta>{rotuloFim}</Ponta>
    </div>
  );
}

/** Rótulo de ponta ("16", "99+"): caixa de 29px no pé do quadro, centrada no trilho. */
function Ponta({ children }: { children: string }) {
  return (
    <span className="flex h-[29px] shrink-0 items-center text-body leading-[normal] text-white">
      {children}
    </span>
  );
}
