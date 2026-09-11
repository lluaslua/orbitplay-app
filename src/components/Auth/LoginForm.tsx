import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Checkbox, Input } from '@/components/UI';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Informe o seu e-mail.')
    .email('Digite um e-mail válido (ex.: nome@estudio.com).'),
  password: z
    .string()
    .min(1, 'Informe a sua senha.')
    .min(6, 'A senha precisa ter pelo menos 6 caracteres.'),
  remember: z.boolean().default(false),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Formulário do login — Figma `181:8146` / `291:2022`.
 *
 * A senha não tem botão de "mostrar" no arquivo, e no lugar de "Recuperar
 * senha" o link é "Esqueci minha senha". O atalho de credenciais de
 * demonstração também não existe lá; quem precisa delas encontra no README.
 */
export function LoginForm({
  role,
  demoEmail,
}: {
  role: Extract<UserRole, 'STUDIO' | 'PLAYER'>;
  demoEmail: string;
}) {
  const { login, isLoading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '', remember: true },
  });

  const remember = watch('remember');
  const ocupado = isLoading || isSubmitting;

  const onSubmit = handleSubmit(async (values) => {
    clearError();
    await login({ ...values, role }).catch(() => {
      // O erro fica no store e aparece no bloco abaixo.
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex w-[514px] max-w-full flex-col gap-4" noValidate>
      <h1 className="font-label text-[32px] font-normal text-white">Bem-vindo!</h1>

      <Input
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder={demoEmail}
        icon={<img src="./icons/figma/login-mail.svg" alt="" className="size-6" />}
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Senha"
        type="password"
        autoComplete="current-password"
        placeholder="Digite..."
        icon={<img src="./icons/figma/login-key.svg" alt="" className="size-6" />}
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="flex items-center gap-4">
        <label className="flex flex-1 cursor-pointer items-center gap-2">
          <Checkbox
            checked={remember}
            onCheckedChange={(value) => setValue('remember', value === true)}
          />
          <span className="text-body text-white">Lembrar login</span>
        </label>

        <button
          type="button"
          className="flex items-center gap-1 text-button text-orbit-blue-deep hover:underline"
          title="Ainda não disponível"
        >
          Esqueci minha senha
          <ArrowRight className="size-5" />
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-orbit-error/40 bg-orbit-error/10 p-3 text-graphic text-orbit-error-l"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={ocupado}
        className="flex h-[58px] w-full items-center justify-center rounded-lg bg-orbit-action font-label text-[24px] font-normal text-white shadow-bevel disabled:opacity-60"
      >
        {ocupado ? 'Entrando...' : 'Entrar!'}
      </button>
    </form>
  );
}
