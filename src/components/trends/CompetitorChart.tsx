import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MomentumBar } from "@/lib/trendCharts";

const SELF = "hsl(var(--primary))";
const GROW = "hsl(var(--status-growing))";
const FADE = "hsl(var(--status-declining))";

const ChartTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as MomentumBar;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium capitalize text-foreground">
        {d.name}
        {d.kind === "self" ? " (reference)" : ""}
      </p>
      <p className="text-muted-foreground">
        {d.momentum > 0 ? "+" : ""}
        {d.momentum}% over the rolling window
      </p>
    </div>
  );
};

/** The perspective's mean momentum plotted next to each tracked competitor. */
const CompetitorChart = ({ bars }: { bars: MomentumBar[] }) => (
  <ResponsiveContainer width="100%" height={200}>
    <BarChart data={bars} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
      <XAxis
        dataKey="name"
        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
        axisLine={false}
        tickLine={false}
        interval={0}
        height={40}
        angle={-20}
        textAnchor="end"
      />
      <YAxis
        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
        tickFormatter={(v: number) => `${v}%`}
        axisLine={false}
        tickLine={false}
        width={44}
      />
      <ReferenceLine y={0} stroke="hsl(var(--border))" />
      <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.25)" }} content={<ChartTooltip />} />
      <Bar dataKey="momentum" radius={[3, 3, 0, 0]}>
        {bars.map((b) => (
          <Cell
            key={b.entityId}
            fill={b.kind === "self" ? SELF : b.momentum >= 0 ? GROW : FADE}
          />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export default CompetitorChart;
