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
import type { DriverBar } from "@/lib/trendCharts";

const GROW = "hsl(var(--status-growing))";
const FADE = "hsl(var(--status-declining))";

const ChartTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as DriverBar;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium capitalize text-foreground">{d.label}</p>
      <p className="text-muted-foreground">
        {d.baseline} → {d.current} weighted signals
      </p>
      {d.entities.length > 0 && (
        <p className="text-muted-foreground">via {d.entities.slice(0, 3).join(", ")}</p>
      )}
    </div>
  );
};

/** Weighted contribution per driver theme or source. */
const DriverCountsChart = ({ drivers }: { drivers: DriverBar[] }) => (
  <ResponsiveContainer width="100%" height={Math.max(140, drivers.length * 30)}>
    <BarChart data={drivers} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
      <XAxis
        type="number"
        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        type="category"
        dataKey="label"
        width={120}
        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
        axisLine={false}
        tickLine={false}
      />
      <ReferenceLine x={0} stroke="hsl(var(--border))" />
      <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.25)" }} content={<ChartTooltip />} />
      <Bar dataKey="contribution" radius={[3, 3, 3, 3]}>
        {drivers.map((d) => (
          <Cell key={d.label} fill={d.contribution >= 0 ? GROW : FADE} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export default DriverCountsChart;
