import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/UI';
import { CHART_COLORS, CHART_TOOLTIP_STYLE, COLORS, GRAPHIC } from '@/utils/colors';
import { cn } from '@/utils/helpers';

/**
 * Gráficos do OrbitPlay.
 *
 * As cores de série vêm de `GRAPHIC` (as 14 cores da prancha "01 Color" do
 * Figma). Eixos e grade usam a rampa neutra do app.
 *
 * IMPORTANTE: o `ResponsiveContainer` fica DENTRO de cada gráfico, nunca no
 * `ChartCard`. Ele clona o filho para injetar width/height; se houvesse um
 * componente nosso no meio, essas props seriam engolidas e o Recharts
 * renderizaria um SVG vazio.
 */
const axisProps = {
  stroke: 'rgba(243, 244, 248, 0.12)',
  tick: { fill: COLORS.muted, fontSize: 12 },
  tickLine: false,
  axisLine: false,
};

const legendStyle = { fontSize: 12, color: COLORS.muted };

/** Moldura padrão de todo gráfico do app. */
export function ChartCard({
  title,
  description,
  action,
  children,
  className,
  height = 260,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  height?: number;
}) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader action={action}>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <div className="w-full shrink-0" style={{ height }}>
        {children}
      </div>
    </Card>
  );
}

export function TestsPerWeekChart({
  data,
  somenteCriados,
}: {
  data: { week: string; created: number; finished: number }[];
  /** "Evolução dos testes" do relatório tem uma série só, sem legenda. */
  somenteCriados?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(243, 244, 248, 0.12)" vertical={false} />
        <XAxis dataKey="week" {...axisProps} />
        <YAxis {...axisProps} allowDecimals={false} />
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: 'rgba(2,137,255,0.08)' }} />
        {!somenteCriados && <Legend wrapperStyle={legendStyle} />}
        <Bar isAnimationActive={false} dataKey="created" name="Criados" fill={GRAPHIC.sapphire} radius={[4, 4, 0, 0]} />
        {!somenteCriados && (
          <Bar isAnimationActive={false} dataKey="finished" name="Concluídos" fill={GRAPHIC.amethyst} radius={[4, 4, 0, 0]} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RatingsOverTimeChart({ data }: { data: { label: string; rating: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="ratingFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GRAPHIC.sapphire} stopOpacity={0.45} />
            <stop offset="100%" stopColor={GRAPHIC.sapphire} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(243, 244, 248, 0.12)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis domain={[0, 5]} {...axisProps} />
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
        <Area
          isAnimationActive={false}
          type="monotone"
          dataKey="rating"
          name="Nota média"
          stroke={GRAPHIC.sapphire}
          strokeWidth={2.5}
          fill="url(#ratingFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function EvolutionChart({
  data,
}: {
  data: { label: string; sessions: number; averageRating: number; bugs: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(243, 244, 248, 0.12)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis yAxisId="left" {...axisProps} allowDecimals={false} />
        <YAxis yAxisId="right" orientation="right" domain={[0, 5]} {...axisProps} />
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
        <Legend wrapperStyle={legendStyle} />
        <Line
          isAnimationActive={false}
          yAxisId="left"
          type="monotone"
          dataKey="sessions"
          name="Sessões"
          stroke={GRAPHIC.amethyst}
          strokeWidth={2.5}
          dot={{ r: 3 }}
        />
        <Line
          isAnimationActive={false}
          yAxisId="left"
          type="monotone"
          dataKey="bugs"
          name="Bugs"
          stroke={GRAPHIC.amber}
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={{ r: 3 }}
        />
        <Line
          isAnimationActive={false}
          yAxisId="right"
          type="monotone"
          dataKey="averageRating"
          name="Nota média"
          stroke={GRAPHIC.sapphire}
          strokeWidth={2.5}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RatingDistributionChart({ data }: { data: { rating: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
        <Legend wrapperStyle={legendStyle} />
        <Pie
          isAnimationActive={false}
          data={data}
          dataKey="count"
          nameKey="rating"
          innerRadius={50}
          outerRadius={84}
          paddingAngle={3}
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={entry.rating} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

/**
 * Mini-área do card "Meu resumo de ganhos" (Figma `198:738`).
 *
 * Sem eixos nem grade: no arquivo ela é só a silhueta da curva ao lado dos
 * números, ocupando 53px de altura.
 */
export function EarningsSparkline({ data }: { data: { label: string; cents: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sparklineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GRAPHIC.emerald} stopOpacity={0.35} />
            <stop offset="100%" stopColor={GRAPHIC.emerald} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={(value: number) => [`R$ ${(value / 100).toFixed(2)}`, 'Ganhos']}
        />
        <Area
          isAnimationActive={false}
          type="monotone"
          dataKey="cents"
          stroke={GRAPHIC.emerald}
          strokeWidth={2}
          fill="url(#sparklineFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Rosca de gêneros do card "Missões e Ranking" (Figma `198:761`), com legenda à direita. */
export function GenreDonut({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
        <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={legendStyle} />
        <Pie
          isAnimationActive={false}
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={62}
          outerRadius={80}
          paddingAngle={0}
          stroke="none"
        >
          {data.map((fatia, index) => (
            <Cell key={fatia.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

export function EarningsChart({
  data,
}: {
  data: { label: string; amountCents: number; sessions: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data.map((point) => ({ ...point, amount: point.amountCents / 100 }))}
        margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
      >
        <defs>
          <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GRAPHIC.amethyst} />
            <stop offset="100%" stopColor={GRAPHIC.sapphire} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(243, 244, 248, 0.12)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(value: number) => `R$ ${value}`} />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Ganhos']}
          cursor={{ fill: 'rgba(12,248,196,0.10)' }}
        />
        <Bar isAnimationActive={false} dataKey="amount" fill="url(#earningsFill)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
