import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import SeoHead from "@/components/SeoHead";

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

const oauthApi = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Missing authorization_id");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const nextPath = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(nextPath);
        return;
      }
      const { data, error: err } = await oauthApi().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (err) return setError(err.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    const api = oauthApi();
    const { data, error: err } = approve
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId);
    if (err) {
      setBusy(false);
      return setError(err.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("No redirect returned by the authorization server.");
    }
    window.location.href = target;
  };

  const clientName = details?.client?.name ?? "this application";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-6 px-6">
      <SeoHead
        title="Authorize access — Big Data Intelligence Hub"
        description="Approve or deny access for a connected application."
        path="/.lovable/oauth/consent"
        noindex
      />
      {error ? (
        <div className="rounded-lg border border-border bg-card p-6">
          <h1 className="text-lg font-semibold">Authorization request failed</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      ) : !details ? (
        <p className="text-sm text-muted-foreground">Loading authorization request…</p>
      ) : (
        <div className="rounded-lg border border-border bg-card p-6">
          <h1 className="text-xl font-semibold">Connect {clientName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {clientName} is requesting access to the Big Data Intelligence Hub tools on your
            behalf. It will act as your account.
          </p>
          <div className="mt-6 flex gap-3">
            <Button disabled={busy} onClick={() => decide(true)}>
              Approve
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => decide(false)}>
              Deny
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
