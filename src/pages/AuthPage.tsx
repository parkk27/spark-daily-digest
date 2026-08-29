import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Check, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import SeoHead from "@/components/SeoHead";
import AuthStoryPanel from "@/components/auth/AuthStoryPanel";
import AuthFooterLinks from "@/components/auth/AuthFooterLinks";
import { AUTH_MESSAGES, authErrorCode, friendlyAuthError, isValidEmail } from "@/lib/authErrors";
import { authCallbackUrl } from "@/config";
import { authLog, authLogError, clearCallbackError, readCallbackError } from "@/lib/authLog";

const TRUST = [
  "Public information only",
  "No proprietary data collected",
  "Secure authentication on our managed backend",
];

const RESEND_COOLDOWN = 30;
const NEXT_KEY = "bdih:auth:next";

/** Google "G" mark, per Google's branding requirements. */
const GoogleIcon = () => (
  <svg className="h-[18px] w-[18px]" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
    <path fill="#FBBC05" d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
  </svg>
);



const AuthPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rawNext = params.get("next") ?? "";
  const next = /^\/(?!\/)/.test(rawNext) ? rawNext : "";
  const afterAuth = next || "/dashboard";
  const wasExpired = params.get("expired") === "1";
  const { user, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Restore session -> skip the sign-in page entirely.
  useEffect(() => {
    if (!loading && user) {
      const stored = sessionStorage.getItem(NEXT_KEY);
      sessionStorage.removeItem(NEXT_KEY);
      const dest = stored && /^\/(?!\/)/.test(stored) ? stored : afterAuth;
      authLog("session_restored", { dest });
      navigate(dest, { replace: true });
    }
  }, [user, loading, navigate, afterAuth]);

  useEffect(() => {
    if (wasExpired) authLog("session_expired");
  }, [wasExpired]);

  useEffect(() => {
    authLog("auth_view");
  }, []);

  // Surface failed callbacks (expired links, cancelled consent, bad state).
  useEffect(() => {
    const cb = readCallbackError();
    if (!cb) return;
    authLogError("oauth_callback", cb, { code: cb.code });
    const raw = `${cb.code} ${cb.description}`;
    const cancelled = /access_denied|cancel|user denied/i.test(raw);
    const expiredLink = /expired|otp_expired|invalid/i.test(raw);
    setError(
      cancelled
        ? AUTH_MESSAGES.cancelled
        : expiredLink
          ? AUTH_MESSAGES.expiredLink
          : AUTH_MESSAGES.callbackFailed,
    );
    clearCallbackError();
  }, []);

  useEffect(() => {
    if (!sentTo) emailRef.current?.focus();
  }, [sentTo]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Always build redirects on the canonical origin so they match the allow-list.
  const returnUrl = authCallbackUrl(next);

  const sendLink = async (address: string) => {
    if (busy) return; // prevent duplicate requests
    setBusy(true);
    setError(null);
    authLog("magic_link_requested", { returnUrl });
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: address,
        options: { emailRedirectTo: returnUrl },
      });
      if (err) {
        setError(friendlyAuthError(err));
        authLogError("otp_failure", err, { reason: authErrorCode(err) });
        return;
      }
      setSentTo(address);
      setCooldown(RESEND_COOLDOWN);
      authLog("otp_success");
      toast.success("Sign-in link sent — check your inbox.");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    if (!isValidEmail(address)) {
      setError(AUTH_MESSAGES.invalidEmail);
      return;
    }
    void sendLink(address);
  };

  const handleGoogle = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    authLog("oauth_start", { provider: "google" });
    try {
      if (next) sessionStorage.setItem(NEXT_KEY, next);
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: authCallbackUrl(next) },
      });
      if (err) {
        setError(friendlyAuthError(err));
        authLogError("oauth_callback", err, {
          provider: "google",
          reason: authErrorCode(err),
        });
        return;
      }
      // Browser navigates to Google; no further action needed.
      authLog("oauth_callback", { provider: "google", status: "redirected" });
    } catch (err) {
      setError(friendlyAuthError(err));
      authLogError("oauth_callback", err, { provider: "google", reason: authErrorCode(err) });
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="relative overflow-hidden">
      <SeoHead
        title="Sign in — Big Data Intelligence Hub"
        description="Sign in to Big Data Intelligence Hub for daily executive briefings, trend momentum and the AI copilot."
        path="/signin"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_20%_0%,hsl(var(--primary)/0.16),transparent_70%)]"
      />

      <div className="container relative grid gap-12 py-12 lg:grid-cols-5 lg:gap-14 lg:py-16">
        {/* Auth panel — first on mobile, right on desktop */}
        <div className="order-1 lg:order-2 lg:col-span-2">
          <div className="lg:sticky lg:top-20">
            <div className="animate-fade-in rounded-2xl border border-border/70 bg-card/70 p-6 shadow-xl backdrop-blur-md">
              {wasExpired && (
                <div className="mb-4 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground">
                  {AUTH_MESSAGES.expired}
                </div>
              )}
              {next && !wasExpired && (
                <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-foreground">
                  Please sign in to access Big Data Intelligence Hub.
                </div>
              )}

              {sentTo ? (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-2">
                    <MailCheck className="h-5 w-5 text-status-growing" aria-hidden="true" />
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                      Check your email
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We've sent a secure sign-in link to{" "}
                    <span className="font-medium text-foreground">{sentTo}</span>.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    The link expires in 15 minutes.
                  </p>

                  <div className="mt-5 space-y-2.5">
                    <Button
                      className="w-full"
                      onClick={() => void sendLink(sentTo)}
                      disabled={busy || cooldown > 0}
                    >
                      {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                      {cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend email"}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSentTo(null);
                        setError(null);
                      }}
                      disabled={busy}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /> Change email
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    Sign in to Big Data Intelligence Hub
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enter your email and we'll send a secure sign-in link — no password needed.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        ref={emailRef}
                        type="email"
                        autoComplete="email"
                        autoFocus
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError(null);
                        }}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={busy}>
                      {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                      Continue
                    </Button>
                  </form>

                  <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => void handleGoogle()}
                    disabled={busy}
                  >
                    Continue with Google
                  </Button>
                </>
              )}

              {error && (
                <div
                  role="alert"
                  className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3"
                >
                  <p className="flex items-start gap-2 text-xs text-foreground">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden="true" />
                    {error}
                  </p>
                  <div className="mt-2.5 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setError(null)} disabled={busy}>
                      Retry
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setError(null);
                        setSentTo(null);
                        emailRef.current?.focus();
                      }}
                    >
                      Use email instead
                    </Button>
                  </div>
                </div>
              )}

              <AuthFooterLinks />
            </div>

            <ul className="mt-5 space-y-2">
              {TRUST.map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-status-growing" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Story panel */}
        <div className="order-2 lg:order-1 lg:col-span-3">
          <AuthStoryPanel />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
