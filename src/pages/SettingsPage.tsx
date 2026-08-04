import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  usePreferences,
  useUpdatePreferences,
  useWatchlist,
  useWatchlistMutations,
  useSavedSearches,
  useSavedSearchMutations,
} from "@/hooks/usePersonalization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import SeoHead from "@/components/SeoHead";

const TECHS = ["spark", "iceberg", "delta lake", "fabric", "bigquery", "emr", "databricks", "streaming", "governance", "ai"];

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const prefs = usePreferences();
  const updatePrefs = useUpdatePreferences();
  const watchlist = useWatchlist();
  const { add: addTopic, remove: removeTopic } = useWatchlistMutations();
  const searches = useSavedSearches();
  const { add: addSearch, remove: removeSearch } = useSavedSearchMutations();

  const [topic, setTopic] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/signin", { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const selected = prefs.data?.preferred_technologies ?? [];

  const toggleTech = (t: string) => {
    const next = selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t];
    updatePrefs.mutate({ preferred_technologies: next });
  };

  return (
    <div className="container max-w-3xl space-y-10 py-8">
      <SeoHead
        title="Settings — Big Data Intelligence Hub"
        description="Manage your preferred technologies, email frequency, watchlist topics and saved searches."
        path="/settings"
      />
      <div>
        <p className="text-sm text-muted-foreground">Account</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
      </div>

      <section className="space-y-4 rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">Preferred technologies</h2>
        <div className="flex flex-wrap gap-2">
          {TECHS.map((t) => (
            <button
              key={t}
              onClick={() => toggleTech(t)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                selected.includes(t)
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">Briefing preferences</h2>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="freq" className="text-sm text-muted-foreground">Email frequency</Label>
          <Select
            value={prefs.data?.email_frequency ?? "off"}
            onValueChange={(v) => updatePrefs.mutate({ email_frequency: v })}
          >
            <SelectTrigger id="freq" className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="off">Off</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="notif" className="text-sm text-muted-foreground">Critical alerts</Label>
          <Switch
            id="notif"
            checked={prefs.data?.notifications_enabled ?? false}
            onCheckedChange={(v) => updatePrefs.mutate({ notifications_enabled: v })}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">Watchlist topics</h2>
        <p className="text-xs text-muted-foreground">Pinned to the top of your News and Trends pages.</p>
        <div className="flex flex-wrap gap-2">
          {(watchlist.data ?? []).map((t) => (
            <span key={t} className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-foreground">
              {t}
              <button aria-label={`Remove ${t}`} onClick={() => removeTopic.mutate(t)}>
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </span>
          ))}
          {(watchlist.data ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground">No topics yet.</p>
          )}
        </div>
        <div className="flex gap-2">
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. iceberg" />
          <Button
            size="icon"
            aria-label="Add topic"
            onClick={() => {
              if (!topic.trim()) return;
              addTopic.mutate(topic, {
                onSuccess: () => setTopic(""),
                onError: () => toast.error("Topic already in your watchlist."),
              });
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">Saved searches</h2>
        <div className="space-y-2">
          {(searches.data ?? []).map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{s.name}</p>
                <p className="truncate text-xs text-muted-foreground">{s.query}</p>
              </div>
              <button aria-label={`Delete ${s.name}`} onClick={() => removeSearch.mutate(s.id)}>
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          ))}
          {(searches.data ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground">No saved searches yet.</p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="Name" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Query" />
          <Button
            onClick={() => {
              if (!searchName.trim() || !searchQuery.trim()) return;
              addSearch.mutate(
                { name: searchName.trim(), query: searchQuery.trim() },
                { onSuccess: () => { setSearchName(""); setSearchQuery(""); } },
              );
            }}
          >
            Save
          </Button>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
