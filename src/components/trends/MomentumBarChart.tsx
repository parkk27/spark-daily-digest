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

const GROW = "hsl(var(--status-growing))";
const FADE = "hsl(var(--status-declining))";

const ChartTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as MomentumBar;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium capitalize text-foreground">{d.name}</p>
      <p className="text-muted-foreground">
        {d.momentum > 0 ? "+" : ""}
        {d.momentum}% · {d.confidence}% confidence
      </p>
    </div>
  );
};

/** Horizontal momentum bars: rising to the right, cooling to the left. */
const MomentumBarChart = ({
  bars,
  onSelect,
}: {
  bars: MomentumBar[];
  onSelect?: (entityId: string) => void;
}) => (
  <ResponsiveContainer width="100%" height={Math.max(160, bars.length * 34)}>
    <BarChart data={bars} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
      <XAxis
        type="number"
        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
        tickFormatter={(v: number) => `${v}%`}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        type="category"
        dataKey="name"
        width={110}
        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", textTransform: "capitalize" }}
        axisLine={false}
        tickLine={false}
      />
      <ReferenceLine x={0} stroke="hsl(var(--border))" />
      <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.25)" }} content={<ChartTooltip />} />
      <Bar
        dataKey="momentum"
        radius={[3, 3, 3, 3]}
        onClick={(d: any) => onSelect?.(d?.entityId)}
        cursor={onSelect ? "pointer" : undefined}
      >
        {bars.map((b) => (
          <Cell key={b.entityId} fill={b.momentum >= 0 ? GROW : FADE} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export default MomentumBarChart;
