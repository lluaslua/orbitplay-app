import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AvisoConta,
  BotaoConta,
  Caixa,
  CampoConta,
  CartaoSucesso,
  CLASSE_INPUT,
  IconeCampo,
  MolduraConta,
} from '@/components/Auth/MolduraConta';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants';
import { senhaValida } from '@/utils/helpers';

const esquemaNovaSenha = z
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

type Valores = z.infer<typeof esquemaNovaSenha>;

const ID_FORM = 'form-nova-senha';

/**
 * "Criar nova senha" e "Senha redefinida!" — Figma: segundo e terceiro cartões
 * da recuperação. É o fim do "Esqueceu sua senha?" e também do convite de
 * Gerenciamento de acessos: a conta convidada fica ativa quando a pessoa define
 * a senha aqui. O link vem da API como `/#/reset-password?token=...`.
 *
 * O texto abaixo do título repete o do "Esqueceu sua senha?" porque é o que o
 * frame traz (parece cópia do cartão anterior). Fica igual até o design revisar.
 */
export default function RedefinirSenhaPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [salva, setSalva] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({ resolver: zodResolver(esquemaNovaSenha), mode: 'onBlur' });

  const onSubmit = handleSubmit(async ({ password }) => {
    setErro(null);
    try {
      await resetPassword(token, password);
      setSalva(true);
    } catch (falha) {
      setErro((falha as { message?: string }).message ?? 'Não foi possível trocar a senha.');
    }
  });

  if (salva) {
    return (
      <CartaoSucesso
        titulo="Senha redefinida!"
        texto="Sua nova senha foi salva. Agora você já pode acessar sua conta."
        rotuloBotao="Entrar!"
        onClick={() => navigate(ROUTES.login, { replace: true })}
      />
    );
  }

  return (
    <MolduraConta
      titulo="Criar nova senha"
      aoVoltar={() => navigate(ROUTES.login, { replace: true })}
      acao={
        token && (
          <BotaoConta form={ID_FORM} ocupado={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Redefinir senha'}
          </BotaoConta>
        )
      }
    >
      <form id={ID_FORM} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <p className="text-graphic text-white">
          Informe o e-mail cadastrado e enviaremos as instruções para criar uma nova senha.
        </p>

        {!token ? (
          <AvisoConta tom="erro">Este link está incompleto. Peça um novo em “Esqueci minha senha”.</AvisoConta>
        ) : (
          <div className="grid grid-cols-2 gap-x-3">
            <CampoConta id="nova-senha" rotulo="Nova senha" obrigatorio erro={errors.password?.message}>
              <Caixa erro={!!errors.password} icone={<IconeCampo nome="login-key" />}>
                <input id="nova-senha" type="password" autoComplete="new-password" placeholder="Digite..." className={CLASSE_INPUT} {...register('password')} />
              </Caixa>
            </CampoConta>
            <CampoConta id="confirmar-nova-senha" rotulo="Confirmar nova senha" obrigatorio erro={errors.confirmacao?.message}>
              <Caixa erro={!!errors.confirmacao} icone={<IconeCampo nome="login-key" />}>
                <input
                  id="confirmar-nova-senha"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Digite..."
                  className={CLASSE_INPUT}
                  {...register('confirmacao')}
                />
              </Caixa>
            </CampoConta>
          </div>
        )}

        {erro && <AvisoConta tom="erro">{erro}</AvisoConta>}
      </form>
    </MolduraConta>
  );
}
