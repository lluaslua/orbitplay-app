import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AvisoConta, BotaoConta, Caixa, CampoConta, CLASSE_INPUT, IconeCampo, MolduraConta } from '@/components/Auth/MolduraConta';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';
import { ROUTES } from '@/utils/constants';

const esquema = z.object({
  email: z.string().trim().min(1, 'Informe o seu e-mail.').email('Digite um e-mail válido (ex.: nome@estudio.com).'),
});

const ID_FORM = 'form-esqueci-senha';

/**
 * "Esqueceu sua senha?" — Figma: primeiro cartão da recuperação. Pede o link
 * de redefinição (`POST /auth/recover`); a API responde a mesma mensagem com ou
 * sem conta, e o link leva a "Criar nova senha". O Figma não desenha o estado
 * de "link enviado": a mensagem da API aparece abaixo do campo.
 */
export default function EsqueciSenhaPage() {
  const { recoverPassword } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { email?: string; role?: UserRole } | null };
  const [resultado, setResultado] = useState<{ ok: boolean; mensagem: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof esquema>>({
    resolver: zodResolver(esquema),
    mode: 'onBlur',
    defaultValues: { email: state?.email ?? '' },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setResultado(null);
    try {
      setResultado({ ok: true, mensagem: await recoverPassword(email.trim()) });
    } catch (erro) {
      setResultado({ ok: false, mensagem: (erro as { message?: string }).message ?? 'Não foi possível pedir o link agora.' });
    }
  });

  return (
    <MolduraConta
      titulo="Esqueceu sua senha?"
      aoVoltar={() => navigate(ROUTES.login, { state: { role: state?.role } })}
      acao={
        <BotaoConta form={ID_FORM} ocupado={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
        </BotaoConta>
      }
    >
      <form id={ID_FORM} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <p className="text-graphic text-white">
          Informe o e-mail cadastrado e enviaremos as instruções para criar uma nova senha.
        </p>

        <CampoConta id="esqueci-email" rotulo="E-mail profissional" obrigatorio erro={errors.email?.message} className="w-[426px] max-w-full">
          <Caixa erro={!!errors.email} icone={<IconeCampo nome="login-mail" />}>
            <input id="esqueci-email" type="email" autoComplete="email" placeholder="Digite..." className={CLASSE_INPUT} {...register('email')} />
          </Caixa>
        </CampoConta>

        {resultado && <AvisoConta tom={resultado.ok ? 'ok' : 'erro'}>{resultado.mensagem}</AvisoConta>}
      </form>
    </MolduraConta>
  );
}
