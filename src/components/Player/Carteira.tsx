import { useRef, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Info,
  KeyRound,
  Receipt,
  ShieldCheck,
  Sparkles,
  Wallet as WalletIcon,
  XCircle,
} from 'lucide-react';
import { PageHeading } from '@/components/Common/PageHeading';
import { Badge, Button, EmptyState, ErrorState, Input, Skeleton } from '@/components/UI';
import { useRequestWithdrawal, useWallet } from '@/hooks/useWallet';
import type { ApiError, Wallet, WalletTransaction, WithdrawalInfo, WithdrawalStatus } from '@/types';
import { ROUTES } from '@/utils/constants';
import { cn, formatAmount, formatCurrency, formatDateTime } from '@/utils/helpers';
import { centavosDoCampo, PIX_KEY_LABELS, pixKeyType } from '@/utils/pix';

/**
 * TELA 13 — Carteira do tester e saque.
 *
 * O dinheiro é simulado, mas o caminho é o de verdade: a recompensa entra no
 * saldo quando o teste é enviado, o saque sai do saldo no pedido e o Pix
 * simulado confirma em alguns segundos. Quem decide valor, limite e saldo é a
 * API; aqui só se valida o formato para não gastar uma ida ao servidor.
 */
export function Carteira() {
  const carteira = useWallet();

  return (
    <div className="flex flex-col gap-8 pb-10">
      <PageHeading
        trilha={[{ label: 'Home', to: ROUTES.player.home }, { label: 'Carteira' }]}
        titulo="Minha carteira"
      />

      {carteira.isLoading ? (
        <CarregandoCarteira />
      ) : carteira.isError || !carteira.data ? (
        <ErrorState
          title="Não foi possível abrir a carteira"
          description="Confira a conexão com a API e tente de novo."
          onRetry={() => void carteira.refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SaldoCard carteira={carteira.data} />
            <SaqueForm carteira={carteira.data} />
          </div>
          <HistoricoDeSaques saques={carteira.data.withdrawals} />
          <Extrato lancamentos={carteira.data.transactions} />
        </>
      )}
    </div>
  );
}

function CarregandoCarteira() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2" aria-busy="true">
      <Skeleton className="h-[300px] rounded-3xl" />
      <Skeleton className="h-[300px] rounded-3xl" />
    </div>
  );
}

/** O saldo em destaque, no degradê Nightfall das ações principais. */
function SaldoCard({ carteira }: { carteira: Wallet }) {
  const emAnalise = carteira.withdrawals
    .filter((saque) => saque.status === 'REQUESTED')
    .reduce((total, saque) => total + saque.amountCents, 0);

  return (
    <section
      aria-label="Saldo disponível"
      className="relative flex flex-col justify-between gap-8 overflow-hidden rounded-3xl bg-orbit-nightfall p-8 shadow-bevel"
    >
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10" />
      <span aria-hidden className="pointer-events-none absolute -bottom-24 right-10 size-52 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between gap-4">
        <span className="flex items-center gap-2 text-subtitle text-white">
          <WalletIcon className="size-6" />
          Saldo disponível
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-label-xs text-white">
          <Sparkles className="size-3.5" />
          Pix simulado
        </span>
      </div>

      <div className="relative whitespace-nowrap text-white">
        <span className="font-label text-[28px] font-light">R$</span>{' '}
        <span className="font-label text-[56px] font-bold leading-none">{formatAmount(carteira.balanceCents)}</span>
      </div>

      <dl className="relative grid grid-cols-3 gap-4 border-t border-white/25 pt-5 text-white">
        <Dado rotulo="Saque mínimo" valor={formatCurrency(carteira.minWithdrawalCents)} />
        <Dado rotulo="Limite em 24 h" valor={formatCurrency(carteira.dailyLimitCents)} />
        <Dado rotulo="Em análise" valor={formatCurrency(emAnalise)} />
      </dl>
    </section>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-caption text-white/75">{rotulo}</dt>
      <dd className="truncate text-body-bold">{valor}</dd>
    </div>
  );
}

/** Valor, chave Pix e o botão. A API barra o que passar do saldo, do limite e do saque único em análise. */
function SaqueForm({ carteira }: { carteira: Wallet }) {
  const saque = useRequestWithdrawal();
  const [centavos, setCentavos] = useState(0);
  const [chavePix, setChavePix] = useState('');
  const [feito, setFeito] = useState<WithdrawalInfo | null>(null);
  // Uma chave por tentativa: repetir o envio devolve o mesmo saque em vez de sacar duas vezes.
  const chave = useRef(crypto.randomUUID());

  const maximo = Math.min(carteira.balanceCents, carteira.dailyLimitCents);
  const tipoDaChave = pixKeyType(chavePix);

  const erroDoValor =
    centavos === 0
      ? undefined
      : centavos < carteira.minWithdrawalCents
        ? `O saque mínimo é de ${formatCurrency(carteira.minWithdrawalCents)}.`
        : centavos > carteira.balanceCents
          ? 'O valor passa do seu saldo.'
          : centavos > carteira.dailyLimitCents
            ? `O limite é de ${formatCurrency(carteira.dailyLimitCents)} a cada 24 horas.`
            : undefined;
  const erroDaChave = chavePix.trim() && !tipoDaChave ? 'Use CPF, CNPJ, telefone com +55, e-mail ou chave aleatória.' : undefined;

  const podeEnviar =
    carteira.canWithdraw && centavos >= carteira.minWithdrawalCents && !erroDoValor && !!tipoDaChave && !saque.isPending;

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!podeEnviar) return;
    saque.mutate(
      { amountCents: centavos, pixKey: chavePix.trim(), chave: chave.current },
      {
        onSuccess: (criado) => {
          setFeito(criado);
          setCentavos(0);
          setChavePix('');
          chave.current = crypto.randomUUID();
        },
      },
    );
  }

  const erroDaApi = saque.error ? (saque.error as unknown as ApiError).message : undefined;

  return (
    <form
      onSubmit={enviar}
      aria-label="Pedir saque"
      className="flex flex-col gap-5 rounded-3xl border border-orbit-border bg-orbit-card p-8"
    >
      <header className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-orbit-nightfall shadow-lg shadow-orbit-blue/30">
          <ArrowUpRight className="size-6 text-white" />
        </span>
        <div className="flex flex-col">
          <h2 className="text-subtitle text-white">Sacar</h2>
          <p className="text-caption text-orbit-muted">Para a sua chave Pix, sem taxa.</p>
        </div>
      </header>

      {feito && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-orbit-success/40 bg-orbit-success/10 p-4 text-white"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-orbit-success-l" />
          <p className="text-small">
            <strong className="text-body-bold">Saque de {formatCurrency(feito.amountCents)} pedido!</strong> O Pix simulado
            confirma em alguns segundos — acompanhe no histórico abaixo.
          </p>
        </div>
      )}

      {!carteira.canWithdraw && carteira.withdrawBlockedReason && (
        <div className="flex items-start gap-3 rounded-2xl border border-orbit-warning/40 bg-orbit-warning/10 p-4 text-white">
          <Info className="mt-0.5 size-5 shrink-0 text-orbit-warning" />
          <p className="text-small">{carteira.withdrawBlockedReason}</p>
        </div>
      )}

      <Input
        label="Valor"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0,00"
        icon={<span className="text-body-bold text-orbit-muted">R$</span>}
        value={centavos === 0 ? '' : formatAmount(centavos)}
        onChange={(evento) => setCentavos(centavosDoCampo(evento.target.value))}
        error={erroDoValor}
        disabled={!carteira.canWithdraw}
      />

      <div className="-mt-2 flex flex-wrap gap-2" role="group" aria-label="Valores rápidos">
        <Atalho
          rotulo="Mínimo"
          desligado={!carteira.canWithdraw || carteira.balanceCents < carteira.minWithdrawalCents}
          aoClicar={() => setCentavos(carteira.minWithdrawalCents)}
        />
        <Atalho
          rotulo="Metade"
          desligado={!carteira.canWithdraw || Math.floor(maximo / 2) < carteira.minWithdrawalCents}
          aoClicar={() => setCentavos(Math.floor(maximo / 2 / 100) * 100)}
        />
        <Atalho
          rotulo="Tudo"
          desligado={!carteira.canWithdraw || maximo < carteira.minWithdrawalCents}
          aoClicar={() => setCentavos(maximo)}
        />
      </div>

      <Input
        label="Chave Pix"
        autoComplete="off"
        placeholder="CPF, e-mail, telefone ou chave aleatória"
        icon={<KeyRound className="size-5 text-orbit-muted" />}
        value={chavePix}
        onChange={(evento) => setChavePix(evento.target.value)}
        error={erroDaChave}
        success={tipoDaChave ? `${PIX_KEY_LABELS[tipoDaChave]} identificado.` : undefined}
        maxLength={140}
        disabled={!carteira.canWithdraw}
      />

      {erroDaApi && (
        <p role="alert" className="px-1 text-small text-orbit-error-l">
          {erroDaApi}
        </p>
      )}

      {/* O degradê do nightfall é imagem de fundo: sem `bg-none` o botão desligado continuaria colorido. */}
      <Button type="submit" variant="nightfall" block disabled={!podeEnviar} className="disabled:bg-none disabled:shadow-none">
        <ArrowUpRight className="size-5" />
        {saque.isPending ? 'Enviando…' : centavos >= carteira.minWithdrawalCents ? `Sacar ${formatCurrency(centavos)}` : 'Sacar!'}
      </Button>

      <p className="flex items-start gap-2 text-caption text-orbit-muted">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        Simulação: nenhum dinheiro real é movimentado. Saldo, limite e status são decididos pelo servidor.
      </p>
    </form>
  );
}

function Atalho({ rotulo, desligado, aoClicar }: { rotulo: string; desligado: boolean; aoClicar: () => void }) {
  return (
    <button
      type="button"
      disabled={desligado}
      onClick={aoClicar}
      className="rounded-full border border-orbit-border px-4 py-1.5 text-label-xs text-white transition-colors hover:border-orbit-blue hover:bg-orbit-blue/10 disabled:pointer-events-none disabled:opacity-40 orbit-focus-ring"
    >
      {rotulo}
    </button>
  );
}

const STATUS_DO_SAQUE: Record<
  WithdrawalStatus,
  { rotulo: string; variante: 'warning' | 'success' | 'error'; icone: typeof Clock3 }
> = {
  REQUESTED: { rotulo: 'Em análise', variante: 'warning', icone: Clock3 },
  PAID: { rotulo: 'Pago', variante: 'success', icone: BadgeCheck },
  REJECTED: { rotulo: 'Recusado', variante: 'error', icone: XCircle },
};

function HistoricoDeSaques({ saques }: { saques: WithdrawalInfo[] }) {
  return (
    <section aria-labelledby="titulo-saques" className="flex flex-col gap-4">
      <h2 id="titulo-saques" className="text-subtitle text-white">
        Histórico de saques
      </h2>

      {saques.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nenhum saque ainda"
          description="Quando você sacar, o pedido aparece aqui e muda para “Pago” sozinho."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {saques.map((saque) => {
            const status = STATUS_DO_SAQUE[saque.status];
            const Icone = status.icone;
            return (
              <li
                key={saque.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-orbit-border bg-orbit-card px-6 py-4"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-orbit-blue">
                  <ArrowUpRight className="size-5" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-body-bold text-white">Saque via Pix · {saque.pixKey}</span>
                  <span className="text-caption text-orbit-muted">
                    Pedido em {formatDateTime(saque.createdAt)}
                    {saque.note ? ` · ${saque.note}` : ''}
                  </span>
                </div>
                <span className="text-body-bold text-white">{formatCurrency(saque.amountCents)}</span>
                <Badge variant={status.variante} size="sm" className={cn(saque.status === 'REQUESTED' && 'animate-pulse')}>
                  <Icone />
                  {status.rotulo}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const ROTULO_DO_LANCAMENTO: Record<WalletTransaction['type'], string> = {
  REWARD: 'Recompensa de teste',
  WITHDRAWAL: 'Saque',
  ADJUSTMENT: 'Ajuste',
};

function Extrato({ lancamentos }: { lancamentos: WalletTransaction[] }) {
  return (
    <section aria-labelledby="titulo-extrato" className="flex flex-col gap-4">
      <h2 id="titulo-extrato" className="text-subtitle text-white">
        Extrato
      </h2>

      {lancamentos.length === 0 ? (
        <EmptyState
          icon={WalletIcon}
          title="Seu extrato está vazio"
          description="Conclua um teste e a recompensa cai aqui, no mesmo instante em que o envio for aceito."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-orbit-border overflow-hidden rounded-2xl border border-orbit-border bg-orbit-card">
          {lancamentos.map((lancamento) => {
            const entrada = lancamento.amountCents >= 0;
            const cancelado = lancamento.status === 'CANCELED';
            return (
              <li key={lancamento.id} className="flex items-center gap-4 px-6 py-4">
                <span
                  className={cn(
                    'grid size-10 shrink-0 place-items-center rounded-full',
                    entrada ? 'bg-orbit-success/15 text-orbit-success-l' : 'bg-white/10 text-white',
                  )}
                >
                  {entrada ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className={cn('truncate text-body-bold text-white', cancelado && 'line-through opacity-60')}>
                    {lancamento.description}
                  </span>
                  <span className="text-caption text-orbit-muted">
                    {ROTULO_DO_LANCAMENTO[lancamento.type]} · {formatDateTime(lancamento.createdAt)}
                    {cancelado ? ' · cancelado' : ''}
                  </span>
                </div>
                <span
                  className={cn(
                    'text-body-bold',
                    cancelado ? 'text-orbit-muted line-through' : entrada ? 'text-orbit-success-l' : 'text-white',
                  )}
                >
                  {entrada ? '+' : '−'} {formatCurrency(Math.abs(lancamento.amountCents))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
