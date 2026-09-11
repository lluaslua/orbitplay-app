import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { Card, CardHeader, CardLink, CardTitle } from '@/components/UI';
import type { BenchmarkRow } from '@/types';
import { ROUTES } from '@/utils/constants';
import { cn, formatAmount } from '@/utils/helpers';

/**
 * Card "Benchmark de mercado" — Figma 291:1439, 884×384.
 *
 * O estado do botão e a cor da barra saem do próprio progresso, que é como o
 * arquivo desenha as cinco linhas: 0% oferece "Iniciar", 100% fica verde e
 * oferece "Completar" em laranja, e o meio do caminho é "Continuar" em azul.
 */
export function BenchmarkCard({ rows }: { rows: BenchmarkRow[] }) {
  return (
    <Card className="justify-between">
      <CardHeader action={<Info className="text-white" />}>
        <CardTitle>Benchmark de mercado</CardTitle>
      </CardHeader>

      <div className="flex flex-1 flex-col justify-center">
        {rows.map((row) => (
          <Linha key={row.id} row={row} />
        ))}
      </div>

      <CardLink asChild>
        <Link to={ROUTES.studio.games}>Ir para meus jogos</Link>
      </CardLink>
    </Card>
  );
}

function Linha({ row }: { row: BenchmarkRow }) {
  const completo = row.progress >= 1;
  const naoIniciado = row.progress <= 0;

  const rotulo = naoIniciado ? 'Iniciar' : completo ? 'Completar' : 'Continuar';

  return (
    <div className="flex items-center gap-6 px-6 py-2">
      <span className="w-[110px] shrink-0 truncate text-graphic text-white">{row.name}</span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-label text-[14px] font-normal leading-[1.1] text-white">
          {Math.round(row.progress * 100)}%
        </span>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#F5FAFE]">
          <div
            className={cn('h-full rounded-full', completo ? 'bg-[#56CA00]' : 'bg-[#16B1FF]')}
            style={{ width: `${Math.min(100, Math.max(0, row.progress * 100))}%` }}
          />
        </div>
      </div>

      <span className="w-[131px] shrink-0 text-graphic text-white">
        + R${formatAmount(row.rewardCents)}
      </span>

      <button
        type="button"
        className={cn(
          'h-[38px] w-24 shrink-0 rounded-lg font-label text-[16px] font-normal text-white shadow-bevel',
          completo ? 'bg-orbit-flame-wide' : 'bg-orbit-action-wide',
        )}
      >
        {rotulo}
      </button>
    </div>
  );
}
