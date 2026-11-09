import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CodigoVerificacao, TAMANHO_CODIGO } from '@/components/Auth/CodigoVerificacao';
import { AvisoConta, BotaoConta, CartaoSucesso, MolduraConta } from '@/components/Auth/MolduraConta';
import { useAuth, type EstadoVerificacao } from '@/hooks/useAuth';
import type { AuthSession } from '@/types';
import { ROUTES } from '@/utils/constants';
import { mascararEmail } from '@/utils/helpers';

const ID_FORM = 'form-verificacao';

/**
 * "Verifique seu e-mail" e "E-mail verificado!" — Figma: os dois cartões de
 * verificação.
 *
 * Serve a dois caminhos, que chegam pelo `state` da navegação:
 * - `cadastro`: confirma a conta nova. O código certo mostra "E-mail
 *   verificado!", e só o "Continuar" entra no app (a sessão espera aqui, no
 *   estado da tela, e some com ela).
 * - `login`: segundo passo do "MFA por E-mail". O Figma não desenha esse caso;
 *   ele reaproveita este cartão com o texto ajustado e entra direto.
 */
export default function VerificarEmailPage() {
  const { isAuthenticated, user, homeFor, verificarEmail, verificarLogin, reenviarCodigo, aplicarSessao, error, clearError, isLoading } =
    useAuth();
  const navigate = useNavigate();
  const estado = (useLocation().state ?? null) as EstadoVerificacao | null;
  const [codigo, setCodigo] = useState('');
  const [sessao, setSessao] = useState<AuthSession | null>(null);
  const [reenvio, setReenvio] = useState<string | null>(null);

  if (isAuthenticated && user) return <Navigate to={homeFor(user.role)} replace />;
  // Sem o e-mail (página recarregada, link colado) não há o que verificar.
  if (!estado?.email) return <Navigate to={ROUTES.login} replace />;

  if (sessao) {
    return (
      <CartaoSucesso
        titulo="E-mail verificado!"
        texto={
          <>
            Seu endereço de e-mail foi confirmado com sucesso.
            <br />
            Sua conta OrbitPlay está pronta para uso.
          </>
        }
        rotuloBotao="Continuar"
        onClick={() => aplicarSessao(sessao)}
      />
    );
  }

  const { email, modo } = estado;
  const completo = codigo.length === TAMANHO_CODIGO;

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!completo) return;
    clearError();
    setReenvio(null);
    try {
      if (modo === 'login') {
        await verificarLogin(email, codigo, estado?.remember ?? false);
      } else {
        setSessao(await verificarEmail(email, codigo));
      }
    } catch {
      // O erro fica no store e aparece no aviso; o código errado sai para digitar de novo.
      setCodigo('');
    }
  }

  async function reenviar() {
    clearError();
    setCodigo('');
    try {
      setReenvio(await reenviarCodigo(email));
    } catch {
      // Erro (limite de reenvios, por exemplo) já está no store.
    }
  }

  return (
    <MolduraConta
      titulo="Verifique seu e-mail"
      aoVoltar={() => {
        clearError();
        navigate(ROUTES.login, { replace: true });
      }}
      acao={
        <BotaoConta form={ID_FORM} ocupado={isLoading} disabled={!completo}>
          {isLoading ? 'Verificando...' : modo === 'login' ? 'Entrar' : 'Verificar e-mail'}
        </BotaoConta>
      }
    >
      <form id={ID_FORM} onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <p className="max-w-[640px] text-graphic text-white">
          Enviamos um código de 6 dígitos para {mascararEmail(email)}.{' '}
          {modo === 'login'
            ? 'Digite o código abaixo para confirmar que é você e entrar na sua conta.'
            : 'Digite o código abaixo para confirmar seu endereço de e-mail e concluir o cadastro.'}
        </p>

        <CodigoVerificacao
          valor={codigo}
          onChange={(novo) => {
            if (error) clearError();
            setCodigo(novo);
          }}
          invalido={!!error}
          desabilitado={isLoading}
        />

        <p className="text-graphic text-white">O código expira em 10 minutos.</p>

        <p className="flex items-center gap-2 text-caption text-white">
          Não recebeu o código?
          <button
            type="button"
            onClick={() => void reenviar()}
            disabled={isLoading}
            className="flex items-center gap-1 font-bold text-orbit-blue hover:underline disabled:opacity-60"
          >
            Reenviar código
            <ArrowRight className="size-4" />
          </button>
        </p>

        {error && <AvisoConta tom="erro">{error}</AvisoConta>}
        {reenvio && !error && <AvisoConta tom="ok">{reenvio}</AvisoConta>}
      </form>
    </MolduraConta>
  );
}
