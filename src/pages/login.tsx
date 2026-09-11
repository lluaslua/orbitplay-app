import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LoginForm } from '@/components/Auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';
import { cn } from '@/utils/helpers';

/**
 * TELA 01 — Login. Figma: `181:8146` (tester) e `291:2022` (estúdio).
 *
 * O frame desenha uma janela de **926×619 com cantos de 24**, flutuando sobre o
 * papel de parede do Windows — e sem barra de título: nem "OrbitPlay v1.0.0.2",
 * nem minimizar/maximizar/fechar. Esses só aparecem depois de entrar. A janela
 * do Electron é encolhida e travada nessa medida por `App.tsx`; aqui é só a
 * caixa.
 *
 * Como não há barra de título, é o próprio cartão que arrasta a janela
 * (`app-drag-region`) — sem isso a janela ficaria presa no meio da tela.
 *
 * A arte da direita muda com a aba, e some sob um degradê que vai do fundo
 * `#080321` até transparente.
 *
 * A arte do tester é um loop animado (o burnout). Vinha como GIF de 2,1 MB com
 * extensão .png; virou WebP animado de 281 KB, mesmos 29 frames a 50ms. Como
 * `object-cover` já a amplia ~2,8x, a compressão mais forte não é visível.
 */
const ABAS: { role: Extract<UserRole, 'STUDIO' | 'PLAYER'>; label: string; arte: string; email: string }[] = [
  {
    role: 'PLAYER',
    label: 'Sou um tester',
    arte: './images/login/tester.webp',
    email: 'player@orbitplay.com',
  },
  {
    role: 'STUDIO',
    label: 'Sou um estúdio',
    arte: './images/login/estudio.png',
    email: 'studio@orbitplay.com',
  },
];

export default function LoginPage() {
  const { isAuthenticated, user, homeFor, clearError } = useAuth();
  const [ativa, setAtiva] = useState(0);

  if (isAuthenticated && user) {
    return <Navigate to={homeFor(user.role)} replace />;
  }

  const aba = ABAS[ativa];

  return (
    <div className="app-drag-region relative flex h-[619px] max-h-full w-[926px] max-w-full flex-col justify-center gap-11 overflow-hidden rounded-3xl bg-orbit-bg p-8">
      {/* Arte de fundo, encostada na direita e apagada pelo degradê */}
      <img
        src={aba.arte}
        alt=""
        className="pointer-events-none absolute inset-y-0 right-0 h-full w-[64%] object-cover"
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[86%]"
        style={{
          backgroundImage: 'linear-gradient(to right, #080321 68.923%, rgba(8, 3, 33, 0) 100%)',
        }}
      />

      <img
        src="./icons/orbitplay-lockup.svg"
        alt="OrbitPlay"
        className="relative h-[29.6px] w-auto self-start"
      />

      {/* Abas de perfil */}
      <div className="relative flex items-start">
        {ABAS.map((item, indice) => {
          const selecionada = indice === ativa;

          return (
            <button
              key={item.role}
              type="button"
              onClick={() => {
                clearError();
                setAtiva(indice);
              }}
              className={cn(
                'flex flex-col items-center pt-3',
                selecionada ? 'gap-4' : 'gap-[17px]',
              )}
              aria-pressed={selecionada}
            >
              <span
                className={cn(
                  'px-3 text-center text-body',
                  selecionada ? 'font-bold text-orbit-blue' : 'text-white',
                )}
              >
                {item.label}
              </span>
              <span
                className={cn('w-full', selecionada ? 'h-0.5 bg-orbit-blue' : 'h-px bg-white')}
              />
            </button>
          );
        })}
      </div>

      <div className="relative">
        {/* A key remonta o formulário ao trocar de aba, limpando o que foi digitado. */}
        <LoginForm key={aba.role} role={aba.role} demoEmail={aba.email} />
      </div>

      <p className="relative flex items-center gap-5 text-body text-white">
        Não tem uma conta OrbitPlay?
        <button
          type="button"
          className="flex items-center gap-1 text-button text-orbit-blue-deep hover:underline"
          title="Ainda não disponível"
        >
          Criar uma conta grátis
          <ArrowRight className="size-5" />
        </button>
      </p>
    </div>
  );
}
