import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  ChevronDown,
  Gamepad2,
  Globe,
  GraduationCap,
  Home,
  LayoutGrid,
  LogOut,
  MessageCircleQuestion,
  Users,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  UserAvatar,
} from '@/components/UI';
import { useAuth } from '@/hooks/useAuth';
import { usePlayerUser, useStudioUser } from '@/stores/authStore';
import type { UserRole } from '@/types';
import { ROUTES } from '@/utils/constants';
import { cn } from '@/utils/helpers';

/**
 * Navegação principal (Figma: node `291:1278`, 1920×96).
 *
 * Valores do arquivo: gap 24 · p 24 · itens h48/p12/gap12/raio 16 com ícone 24
 * e rótulo **Ubuntu 12**. Item ativo: borda inferior `#F8643B`, raio 8, texto
 * `#F8643B` em Bold. Grupo da direita: chip `rgba(243,244,248,0.2)`, avatar 48
 * com ponto online `#00FF78`.
 *
 * Itens sem tela desenhada no Figma (Benchmark, Tutorial e formação,
 * Comunidade) aparecem porque estão no design, mas não navegam.
 */
interface NavItem {
  label: string;
  icon: LucideIcon;
  to?: string;
  end?: boolean;
}

const STUDIO_NAV: NavItem[] = [
  { label: 'Home', icon: Home, to: ROUTES.studio.home, end: true },
  { label: 'Meus Jogos', icon: Gamepad2, to: ROUTES.studio.games },
  { label: 'Plug-in Telemetria', icon: BarChart3 },
  { label: 'Benchmark', icon: LayoutGrid },
  { label: 'Tutorial e formação', icon: GraduationCap },
  { label: 'Comunidade', icon: Users },
];

const PLAYER_NAV: NavItem[] = [
  { label: 'Home', icon: Home, to: ROUTES.player.home, end: true },
  { label: 'Jogos', icon: Gamepad2, to: ROUTES.player.catalog },
  { label: 'Meus testes e ganhos', icon: Wallet },
  { label: 'Tutorial e formação', icon: GraduationCap },
  { label: 'Comunidade', icon: Users },
];

function navFor(role: UserRole): NavItem[] {
  return role === 'STUDIO' ? STUDIO_NAV : PLAYER_NAV;
}

/**
 * Rótulo de item: Ubuntu 12, Bold quando ativo.
 *
 * Os espaçamentos do arquivo (gap 12, p 12) só valem a partir de `figma`. A
 * barra inteira como desenhada pede 1679px de conteúdo — mais do que a largura
 * útil de uma janela de 1440 —, então abaixo disso ela aperta.
 */
const itemBase =
  'flex h-12 items-center gap-2 p-2 font-label text-[12px] transition-colors whitespace-nowrap figma:gap-3 figma:p-3';

/**
 * Rótulo do item.
 *
 * Some abaixo de `folgado`: mesmo apertando os espaçamentos, os seis itens com
 * texto não cabem numa janela de 1180. Sobra o ícone, e o nome fica no `title`.
 */
function Rotulo({ children }: { children: React.ReactNode }) {
  return <span className="hidden folgado:inline">{children}</span>;
}

export function Navbar() {
  const { user, logout } = useAuth();
  const studio = useStudioUser();
  const player = usePlayerUser();

  if (!user) return null;

  const displayName = studio ? studio.studio.organization : user.name;

  return (
    <nav
      /*
       * Grudada no topo enquanto a página rola.
       *
       * A barra é transparente por natureza — quem pinta o fundo é o container
       * do MainLayout. Grudada, o conteúdo passaria por baixo e apareceria
       * através dela, então ela repete o mesmo fundo: `orbit-glow` + cor de
       * base + `bg-fixed`. O `bg-fixed` ancora o degradê no viewport, o mesmo
       * que o container faz, então os dois coincidem pixel a pixel e não existe
       * emenda visível na borda de baixo.
       */
      className="app-drag-region orbit-glow sticky top-0 z-30 flex h-24 shrink-0 items-center gap-2 bg-orbit-bg bg-fixed px-4 py-6 figma:gap-6 figma:p-6"
    >
      {/*
        Marca: o lockup traz símbolo e tipografia juntos e ocupa 174px. Em
        janela estreita esse espaço faz falta para os itens, então fica só o
        símbolo.
      */}
      <img
        src="./icons/orbitplay-mark.svg"
        alt="OrbitPlay"
        className="app-no-drag h-10 w-auto shrink-0 figma:hidden"
      />
      <img
        src="./icons/orbitplay-lockup.svg"
        alt="OrbitPlay"
        className="app-no-drag hidden h-10 w-auto shrink-0 figma:block"
      />

      {/* Itens */}
      {navFor(user.role).map((item) =>
        item.to ? (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            title={item.label}
            className={({ isActive }) =>
              cn(
                'app-no-drag',
                itemBase,
                isActive
                  ? 'rounded-lg border-b border-orbit-orange font-bold text-orbit-orange'
                  : 'rounded-2xl font-normal text-white hover:text-orbit-orange',
              )
            }
          >
            <item.icon className="size-6 shrink-0" />
            <Rotulo>{item.label}</Rotulo>
          </NavLink>
        ) : (
          // Desenhado no Figma, mas sem tela correspondente.
          <span
            key={item.label}
            className={cn('app-no-drag rounded-2xl font-normal text-white/60', itemBase)}
            title={`${item.label} — ainda não disponível`}
          >
            <item.icon className="size-6 shrink-0" />
            <Rotulo>{item.label}</Rotulo>
          </span>
        ),
      )}

      <div className="flex-1" />

      <span className={cn('app-no-drag rounded-2xl text-white', itemBase)} title="Ajuda">
        <MessageCircleQuestion className="size-6 shrink-0" />
        <Rotulo>Ajuda</Rotulo>
      </span>

      {/* Grupo da direita */}
      <div className="app-no-drag flex shrink-0 items-center gap-3">
        <button
          type="button"
          className="flex h-9 items-center justify-center gap-2 rounded-lg bg-orbit-chip px-3 py-[7px] text-[16px] font-bold text-white"
        >
          <Globe className="size-5" />
          PT
        </button>

        <button
          type="button"
          aria-label="Notificações"
          className="grid size-9 place-items-center rounded-lg bg-orbit-chip p-2 text-white"
        >
          <Bell className="size-5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 orbit-focus-ring">
              <span className="relative">
                <UserAvatar name={user.name} src={user.avatarUrl} className="size-12" />
                {/* Ponto de online: Graphic/G-Emerald com borda do fundo */}
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-orbit-bg bg-orbit-g-emerald" />
              </span>

              <span className="flex items-center gap-1">
                <span className="hidden text-[16px] font-bold text-white folgado:inline">
                  {displayName}
                </span>
                <ChevronDown className="size-5 shrink-0 text-white" />
              </span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem disabled>{user.email}</DropdownMenuItem>
            {player && (
              <DropdownMenuItem disabled>Nível {player.player.level}</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => logout()}>
              <LogOut />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
