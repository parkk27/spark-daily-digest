import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimelineSeries } from "@/lib/trendCharts";

const PALETTE = [
  "hsl(var(--primary))",
  "hsl(var(--status-growing))",
  "hsl(var(--status-declining))",
  "hsl(217 60% 75%)",
  "hsl(40 90% 60%)",
];

/**
 * Momentum percent per stored snapshot window. History accumulates as the
 * pipeline writes new windows — nothing is interpolated between points.
 */
const MomentumTimeline = ({ series }: { series: TimelineSeries }) => {
  if (!series.hasHistory) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        Collecting history — {series.points.length || 0} snapshot window
        {series.points.length === 1 ? "" : "s"} stored so far. The timeline draws once at least two
        windows exist for an entity.
      </p>
    );
  }

  return (
    <>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={series.points} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="hsl(var(--border) / 0.4)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(v: number) => `${v}%`}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <ReferenceLine y={0} stroke="hsl(var(--border))" />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 6,
              fontSize: 12,
            }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
            formatter={(v: number, name: string) => [`${v > 0 ? "+" : ""}${v}%`, name]}
          />
          {series.entities.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-3 flex flex-wrap gap-3">
        {series.entities.map((name, i) => (
          <span key={name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: PALETTE[i % PALETTE.length] }}
            />
            <span className="capitalize">{name}</span>
          </span>
        ))}
      </div>
    </>
  );
};

export default MomentumTimeline;
