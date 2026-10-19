import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { MolduraAuth } from '@/components/Auth/MolduraAuth';
import { Input } from '@/components/UI';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants';
import { senhaValida } from '@/utils/helpers';

const esquema = z
  .object({
    password: z
      .string()
      .refine(senhaValida, 'Use 8 ou mais caracteres com maiúscula, minúscula, número e símbolo.'),
    confirmacao: z.string().min(1, 'Repita a senha.'),
  })
  .refine((valores) => valores.password === valores.confirmacao, {
    message: 'As senhas não são iguais.',
    path: ['confirmacao'],
  });

type Valores = z.infer<typeof esquema>;

/**
 * Nova senha pelo link do e-mail — tela provisória, sem frame no Figma. É o
 * fim do "Esqueci minha senha" e também do convite de Gerenciamento de acessos:
 * a conta convidada fica ativa quando a pessoa define a senha aqui. O link vem
 * da API como `/#/reset-password?token=...`.
 */
export default function RedefinirSenhaPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { resetPassword } = useAuth();
  const [resultado, setResultado] = useState<{ ok: boolean; mensagem: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({ resolver: zodResolver(esquema), mode: 'onBlur' });

  const onSubmit = handleSubmit(async ({ password }) => {
    try {
      setResultado({ ok: true, mensagem: await resetPassword(token, password) });
    } catch (erro) {
      setResultado({ ok: false, mensagem: (erro as { message?: string }).message ?? 'Não foi possível trocar a senha.' });
    }
  });

  return (
    <MolduraAuth ativa={0}>
      <div className="relative flex w-[514px] max-w-full flex-col gap-4">
        <h1 className="font-label text-[32px] font-normal text-white">Nova senha</h1>

        {!token ? (
          <Aviso ok={false} mensagem="Este link está incompleto. Peça um novo em “Esqueci minha senha”." />
        ) : resultado?.ok ? (
          <Aviso ok mensagem={resultado.mensagem} />
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Nova senha"
              type="password"
              autoComplete="new-password"
              placeholder="Digite..."
              hint="8+ caracteres, maiúscula, número e símbolo"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirme a senha"
              type="password"
              autoComplete="new-password"
              placeholder="Digite..."
              error={errors.confirmacao?.message}
              {...register('confirmacao')}
            />

            {resultado && <Aviso ok={false} mensagem={resultado.mensagem} />}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-[58px] w-full items-center justify-center rounded-lg bg-orbit-action font-label text-[24px] font-normal text-white shadow-bevel disabled:opacity-60"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar senha'}
            </button>
          </form>
        )}
      </div>

      <Link
        to={ROUTES.login}
        className="relative flex w-fit items-center gap-1 text-button text-orbit-blue-deep hover:underline"
      >
        Voltar para o login
        <ArrowRight className="size-5" />
      </Link>
    </MolduraAuth>
  );
}

function Aviso({ ok, mensagem }: { ok: boolean; mensagem: string }) {
  const Icone = ok ? CheckCircle2 : AlertCircle;
  return (
    <p
      role={ok ? 'status' : 'alert'}
      className={
        ok
          ? 'flex items-start gap-2 rounded-lg border border-orbit-success/40 bg-orbit-success/10 p-3 text-graphic text-orbit-success'
          : 'flex items-start gap-2 rounded-lg border border-orbit-error/40 bg-orbit-error/10 p-3 text-graphic text-orbit-error-l'
      }
    >
      <Icone className="mt-0.5 size-4 shrink-0" />
      {mensagem}
    </p>
  );
}
