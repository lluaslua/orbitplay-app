import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helpers';

/**
 * Campos de formulário do design system
 * (Figma: prancha "14 Input", node `151:7548` — sets `Input` e `Multiple line input`).
 *
 * O set tem 8 variantes no eixo `State`. Em React elas não viram 8 props: as que
 * o navegador já representa sozinho ficam em pseudo-classe, e só as que dependem
 * de validação viram `tone`.
 *
 *   Default / Complete             estado normal
 *   Hover / Focus / Active typing  `hover:` e `focus-within:`
 *   Positive / Negative            `tone="positive" | "negative"`
 *   Disabled                       o próprio atributo `disabled`
 *
 * Medidas do arquivo, iguais nas 8: altura 46 · raio 12 · padding 16 · gap 12.
 *
 * **Onde a prancha e as telas divergem.** A prancha foi desenhada sobre fundo
 * claro; as 20 telas do app são escuras. Onde discordam, vale a tela — é o que
 * está no ar e aprovado —, com o valor da prancha anotado:
 *
 *   borda   telas 1px          · prancha 2px
 *   fundo   telas `orbit-field`· prancha #FFFFFF
 *   hover   telas branco       · prancha #111827 (sumiria no escuro)
 *   label   telas 16 bold      · prancha 12 bold
 *
 * `surface="light"` atende o único lugar claro do app: a barra de envio do chat
 * da comunidade. Lá o texto é escuro, a borda é a #585D68 do frame `395:2656`
 * e o hover volta a ser o #111827 da prancha, que sobre o claro aparece.
 */
export type FieldTone = 'default' | 'positive' | 'negative';

const caixaVariants = cva(
  'flex h-[46px] w-full items-center gap-3 rounded-xl border px-4 transition-colors',
  {
    variants: {
      tone: {
        // A borda do estado normal depende da superfície: ver `compoundVariants`.
        default: 'focus-within:border-orbit-blue',
        positive: 'border-orbit-success',
        negative: 'border-orbit-error',
      },
      surface: {
        dark: 'bg-orbit-field text-white',
        light: 'bg-orbit-field text-orbit-dark',
      },
      desligado: {
        true: 'pointer-events-none border-orbit-medium bg-orbit-light text-orbit-medium',
        false: '',
      },
    },
    compoundVariants: [
      { tone: 'default', surface: 'dark', class: 'border-orbit-border hover:border-white' },
      { tone: 'default', surface: 'light', class: 'border-orbit-faint hover:border-orbit-dark' },
    ],
    defaultVariants: { tone: 'default', surface: 'dark', desligado: false },
  },
);

export type CaixaVariants = VariantProps<typeof caixaVariants>;

/**
 * As classes da caixa, para blocos que têm a **forma** de campo sem serem um:
 * o "Mostrar: 5" do rodapé das tabelas, por exemplo. Existe para esses casos
 * reusarem os mesmos tokens em vez de recolar a string de classes.
 */
export function caixaCampo(opts?: CaixaVariants) {
  return caixaVariants(opts);
}

/**
 * Cor do rótulo e do hint.
 *
 * A prancha usa #1FC16B / #D00416, que são os tons pensados para fundo claro.
 * Sobre `#080321` eles ficam escuros demais para ler, então aqui valem as
 * variantes claras da mesma família (`-l`), que é o que o app já mostrava.
 * A **borda** continua no valor exato da prancha.
 */
const toneTexto: Record<FieldTone, string> = {
  default: 'text-white',
  positive: 'text-orbit-success-l',
  negative: 'text-orbit-error-l',
};

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    required?: boolean;
    tone?: FieldTone;
    disabled?: boolean;
  }
>(({ className, children, required, tone = 'default', disabled, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('text-body-bold', disabled ? 'text-white/40' : toneTexto[tone], className)}
    {...props}
  >
    {children}
    {required && '*'}
  </LabelPrimitive.Root>
));
Label.displayName = 'Label';

/** Texto de apoio abaixo do campo — assume a cor do estado. */
export function Hint({
  children,
  tone = 'default',
  disabled,
}: {
  children: React.ReactNode;
  tone?: FieldTone;
  disabled?: boolean;
}) {
  return (
    <p className={cn('px-4 text-caption', disabled ? 'text-white/40' : toneTexto[tone])}>
      {children}
    </p>
  );
}

export function FieldError({ message }: { message: string }) {
  return <Hint tone="negative">{message}</Hint>;
}

interface Comuns {
  label?: string;
  required?: boolean;
  /** Mensagem de erro: põe o campo em Negative e vira o hint. */
  error?: string;
  /** Confirmação: põe o campo em Positive. */
  success?: string;
  hint?: string;
  surface?: 'dark' | 'light';
  /** Classes do bloco externo — normalmente a largura. */
  className?: string;
}

function tomDe(error?: string, success?: string): FieldTone {
  return error ? 'negative' : success ? 'positive' : 'default';
}

/** Rótulo + controle + hint no espaçamento do arquivo (gap 4). */
function Envolve({
  label,
  required,
  tone,
  disabled,
  message,
  className,
  children,
}: {
  label?: string;
  required?: boolean;
  tone: FieldTone;
  disabled?: boolean;
  message?: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (!label && !message?.trim()) {
    return <div className={cn('w-full', className)}>{children}</div>;
  }

  return (
    <label className={cn('flex w-full flex-col gap-1', className)}>
      {label && (
        <span
          className={cn('text-body-bold', disabled ? 'text-white/40' : toneTexto[tone])}
        >
          {label}
          {required && '*'}
        </span>
      )}
      {children}
      {message?.trim() && (
        <Hint tone={tone} disabled={disabled}>
          {message}
        </Hint>
      )}
    </label>
  );
}

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    Comuns {
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      required,
      error,
      success,
      hint,
      surface = 'dark',
      icon,
      iconRight,
      disabled,
      ...props
    },
    ref,
  ) => {
    const tone = tomDe(error, success);

    return (
      <Envolve
        label={label}
        required={required}
        tone={tone}
        disabled={disabled}
        message={error ?? success ?? hint}
        className={className}
      >
        <span className={caixaVariants({ tone, surface, desligado: !!disabled })}>
          {icon && <span className="shrink-0 [&_svg]:size-5">{icon}</span>}

          <input
            ref={ref}
            disabled={disabled}
            aria-invalid={!!error}
            className="min-w-0 flex-1 bg-transparent text-body text-inherit outline-none placeholder:text-orbit-muted"
            {...props}
          />

          {iconRight && <span className="shrink-0 [&_svg]:size-5">{iconRight}</span>}
        </span>
      </Envolve>
    );
  },
);
Input.displayName = 'Input';

/**
 * Dropdown nativo dentro da caixa do design system.
 *
 * A seta do sistema sai (`appearance-none`) e entra a `vuesax/linear/arrow-down`
 * de 20px que o arquivo desenha. Sem isso cada tela mostrava um controle
 * diferente conforme o sistema operacional.
 */
export interface SelectFieldProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    Comuns {}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      className,
      label,
      required,
      error,
      success,
      hint,
      surface = 'dark',
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const tone = tomDe(error, success);

    return (
      <Envolve
        label={label}
        required={required}
        tone={tone}
        disabled={disabled}
        message={error ?? success ?? hint}
        className={className}
      >
        <span
          className={cn(caixaVariants({ tone, surface, desligado: !!disabled }), 'relative')}
        >
          <select
            ref={ref}
            disabled={disabled}
            className="min-w-0 flex-1 appearance-none bg-transparent pr-6 text-body text-inherit outline-none"
            {...props}
          >
            {children}
          </select>
          <ChevronBaixo />
        </span>
      </Envolve>
    );
  },
);
SelectField.displayName = 'SelectField';

function ChevronBaixo() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2"
      fill="none"
      aria-hidden
    >
      <path
        d="m5 7.5 5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Set `Multiple line input` da mesma prancha: a caixa cresce, o resto é igual. */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    Comuns {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, label, required, error, success, hint, surface = 'dark', disabled, ...props },
    ref,
  ) => {
    const tone = tomDe(error, success);

    return (
      <Envolve
        label={label}
        required={required}
        tone={tone}
        disabled={disabled}
        message={error ?? success ?? hint}
        className={className}
      >
        <span
          className={cn(caixaVariants({ tone, surface, desligado: !!disabled }), 'h-auto py-4')}
        >
          <textarea
            ref={ref}
            disabled={disabled}
            aria-invalid={!!error}
            className="min-h-[88px] w-full resize-y bg-transparent text-body text-inherit outline-none placeholder:text-orbit-muted"
            {...props}
          />
        </span>
      </Envolve>
    );
  },
);
Textarea.displayName = 'Textarea';

/** Rótulo + controle arbitrário + hint, para quem não usa `Input` direto. */
export function Field({
  label,
  required,
  error,
  success,
  helper,
  htmlFor,
  disabled,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  helper?: string;
  htmlFor?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const tone: FieldTone = error ? 'negative' : success ? 'positive' : 'default';
  const message = error ?? success ?? helper;

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={htmlFor} required={required} tone={tone} disabled={disabled}>
        {label}
      </Label>
      {children}
      {message && (
        <Hint tone={tone} disabled={disabled}>
          {message}
        </Hint>
      )}
    </div>
  );
}
