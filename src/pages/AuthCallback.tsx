import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { authLog, authLogError, readCallbackError } from "@/lib/authLog";

const NEXT_KEY = "bdih:auth:next";
const isSafePath = (p: string | null | undefined) => !!p && /^\/(?!\/)/.test(p);

/**
 * Single return point for Google OAuth and email magic links.
 * Waits for the session to hydrate, then forwards to the intended destination.
 * Failures are handed back to /signin, which renders the friendly message.
 */
const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;

    const finish = (dest: string) => {
      if (done) return;
      done = true;
      navigate(dest, { replace: true });
    };

    // Provider-reported failures (cancelled consent, expired link, bad state).
    const cbError = readCallbackError();
    if (cbError) {
      authLogError("oauth_callback", cbError, { code: cbError.code });
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const forward = new URLSearchParams();
      ["error", "error_code", "error_description"].forEach((k) => {
        const v = params.get(k) ?? hash.get(k);
        if (v) forward.set(k, v);
      });
      finish(`/signin?${forward.toString()}`);
      return;
    }

    const nextParam = new URLSearchParams(window.location.search).get("next");
    const stored = sessionStorage.getItem(NEXT_KEY);
    const dest = isSafePath(nextParam)
      ? (nextParam as string)
      : isSafePath(stored)
        ? (stored as string)
        : "/dashboard";

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) return;
      sessionStorage.removeItem(NEXT_KEY);
      authLog("session_restored", { dest });
      finish(dest);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        sessionStorage.removeItem(NEXT_KEY);
        authLog("session_restored", { dest });
        finish(dest);
      }
    });

    // No session materialised — send the user back to sign in.
    const timeout = setTimeout(() => {
      if (!done) {
        authLog("oauth_callback", { status: "no_session" });
        finish("/signin?error=callback_failed");
      }
    }, 6000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">Completing sign in…</p>
    </div>
  );
};

export default AuthCallback;
