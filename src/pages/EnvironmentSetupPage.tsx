import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import SeoHead from "@/components/SeoHead";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check, Copy, Lock, KeyRound, ShieldAlert } from "lucide-react";

interface EnvRow {
  name: string;
  description: string;
  visibility: "public" | "backend-only";
  source: string;
  value?: string;
  action?: string;
}

const publicRows: EnvRow[] = [
  {
    name: "VITE_SUPABASE_URL",
    description: "Public Supabase project URL. The browser and edge functions both use it.",
    visibility: "public",
    source: "Lovable Cloud / .env",
    value: import.meta.env.VITE_SUPABASE_URL,
  },
  {
    name: "VITE_SUPABASE_PUBLISHABLE_KEY",
    description: "Public anon key. Also known as SUPABASE_ANON_KEY. Safe to ship in the browser because RLS enforces access rules.",
    visibility: "public",
    source: "Lovable Cloud / .env",
    value: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  },
  {
    name: "SUPABASE_ANON_KEY",
    description: "Same value as VITE_SUPABASE_PUBLISHABLE_KEY. Used by backend code and documentation.",
    visibility: "public",
    source: "Lovable Cloud / .env",
    value: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  },
  {
    name: "VITE_SUPABASE_PROJECT_ID",
    description: "Optional project identifier used by some integrations.",
    visibility: "public",
    source: "Lovable Cloud / .env",
    value: import.meta.env.VITE_SUPABASE_PROJECT_ID,
  },
];

const backendRows: EnvRow[] = [
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    description: "Bypasses RLS. Used only by edge functions on the server. Never exposed to the browser.",
    visibility: "backend-only",
    source: "Lovable Cloud",
    action: "Not retrievable on Lovable Cloud.",
  },
  {
    name: "FIRECRAWL_API_KEY",
    description: "Powers the web scraping pipeline.",
    visibility: "backend-only",
    source: "Firecrawl connector",
    action: "Update in Connectors → Firecrawl.",
  },
  {
    name: "GOOGLE_SEARCH_CONSOLE_API_KEY",
    description: "Used for Google Search Console integration and SEO diagnostics.",
    visibility: "backend-only",
    source: "Google Search Console connector",
    action: "Update in Connectors → Google Search Console.",
  },
  {
    name: "LOVABLE_API_KEY",
    description: "Auto-provisioned key for the Lovable AI Gateway and connectors.",
    visibility: "backend-only",
    source: "Lovable Cloud auto-provisioned",
    action: "Rotate via the Lovable API key rotation tool.",
  },
  {
    name: "OPENAI_API_KEY",
    description: "Not configured in this project. AI is routed through the Lovable AI Gateway instead of OpenAI directly.",
    visibility: "backend-only",
    source: "Not configured",
    action: "Only needed if you want to call OpenAI directly from an edge function.",
  },
];

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      aria-label="Copy value"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function ValueCell({ row }: { row: EnvRow }) {
  if (row.value) {
    return (
      <div className="flex items-center gap-2">
        <code className="break-all rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
          {row.value}
        </code>
        <CopyButton value={row.value} />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Lock className="h-3.5 w-3.5" />
      <span>{row.action ?? "Hidden"}</span>
    </div>
  );
}

function VisibilityBadge({ visibility }: { visibility: EnvRow["visibility"] }) {
  if (visibility === "public") {
    return <Badge variant="secondary" className="text-xs">Public / frontend</Badge>;
  }
  return <Badge variant="outline" className="text-xs">Backend-only</Badge>;
}

export default function EnvironmentSetupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleClaimAdmin = async () => {
    setClaiming(true);
    try {
      const { data, error } = await supabase.functions.invoke("bootstrap-admin", {
        method: "POST",
      });
      if (error) throw error;
      const result = data as { bootstrapped: boolean; reason?: string };
      if (result.bootstrapped) {
        toast.success("Admin access granted. Reloading permissions...");
        await queryClient.refetchQueries({ queryKey: ["is-admin", user?.id], exact: true });
      } else if (result.reason === "admin-exists") {
        toast.error("An admin already exists. Ask an existing admin to grant you access.");
      } else {
        toast.error("Could not grant admin access.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setClaiming(false);
    }
  };


  if (authLoading || adminLoading) {
    return (
      <div className="container max-w-5xl py-8">
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container max-w-5xl space-y-8 py-8">
      <SeoHead
        title="Environment Setup — Big Data Intelligence Hub"
        description="Admin reference for secrets and environment variables used by the app."
        path="/admin/environment"
        noindex
      />

      <div>
        <p className="text-sm text-muted-foreground">Admin</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Environment &amp; Secrets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reference guide for every key and environment variable, plus where to update or rotate it.
        </p>
      </div>

      {!isAdmin && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Admin access required
            </CardTitle>
            <CardDescription>
              This page is visible to admins only. You can claim the first admin role if no admin has been assigned yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleClaimAdmin} disabled={claiming}>
              {claiming ? "Claiming..." : "Claim admin access"}
            </Button>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-5 w-5 text-primary" />
                Public frontend variables
              </CardTitle>
              <CardDescription>
                These values are safe to expose in the browser bundle. They identify the project but do not grant privileged access; RLS protects the data.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-44">Variable</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publicRows.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="font-mono text-xs">{row.name}</TableCell>
                      <TableCell><VisibilityBadge visibility={row.visibility} /></TableCell>
                      <TableCell><ValueCell row={row} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.source}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-5 w-5 text-primary" />
                Backend-only secrets
              </CardTitle>
              <CardDescription>
                These keys never leave the server. They are stored in Lovable Cloud secrets or connectors and are not available to the browser.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-44">Secret</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>How to manage</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backendRows.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="font-mono text-xs">{row.name}</TableCell>
                      <TableCell><VisibilityBadge visibility={row.visibility} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.action}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.source}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Self-hosting / Vercel checklist</CardTitle>
              <CardDescription>
                If you ever deploy the frontend outside Lovable, only these variables are required for the build.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">VITE_SUPABASE_URL</code>
                {" "}= {import.meta.env.VITE_SUPABASE_URL}
              </p>
              <p>
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">VITE_SUPABASE_PUBLISHABLE_KEY</code>
                {" "}= your publishable key (same as above)
              </p>
              <p>
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">VITE_SUPABASE_PROJECT_ID</code>
                {" "}= {import.meta.env.VITE_SUPABASE_PROJECT_ID}
              </p>
              <p className="pt-2 text-xs">
                All backend functions remain on Lovable Cloud, so the other secrets never need to be copied into a third-party host.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
