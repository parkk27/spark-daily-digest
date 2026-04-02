import { trends } from "@/data/mockData";
import StatusBadge from "@/components/StatusBadge";
import { Hash } from "lucide-react";

const TrendsPage = () => {
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground opacity-0 animate-fade-in">
        Ecosystem Trends
      </h1>

      <div className="grid gap-3 sm:grid-cols-2">
        {trends.map((trend, i) => (
          <div
            key={trend.topic}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4 opacity-0 animate-fade-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-2.5">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{trend.topic}</span>
            </div>
            <StatusBadge status={trend.status} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendsPage;
