import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Github } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import SeoHead from "@/components/SeoHead";
import AuthStoryPanel from "@/components/auth/AuthStoryPanel";

const TRUST = [
  "Public information only",
  "No proprietary data collected",
  "Secure authentication on our managed backend",
];

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const rawNext = params.get("next") ?? "";
  // Only allow same-origin relative paths.
  const next = /^\/(?!\/)/.test(rawNext) ? rawNext : "";
  const afterAuth = next || "/dashboard";
  const isSignup = location.pathname === "/signup";
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate(afterAuth, { replace: true });
  }, [user, loading, navigate, afterAuth]);

  const withBusy = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const returnUrl =
    window.location.origin + (next ? `/signin?next=${encodeURIComponent(next)}` : "/signin");


  const handleSignIn = (e: FormEvent) => {
    e.preventDefault();
    withBusy(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return toast.error(error.message);
      navigate(afterAuth, { replace: true });
    });
  };

  const handleSignUp = (e: FormEvent) => {
    e.preventDefault();
    withBusy(async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: returnUrl },
      });
      if (error) return toast.error(error.message);
      if (!data.session) toast.success("Check your email to confirm your account.");
      else navigate(afterAuth, { replace: true });
    });
  };

  const handleMagicLink = () => {
    if (!email) return toast.error("Enter your email first.");
    withBusy(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: returnUrl },
      });
      if (error) return toast.error(error.message);
      toast.success("Magic link sent — check your inbox.");
    });
  };

  const handleForgotPassword = () => {
    if (!email) return toast.error("Enter your email first.");
    withBusy(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: returnUrl,
      });
      if (error) return toast.error(error.message);
      toast.success("Password reset link sent — check your inbox.");
    });
  };

  const handleGoogle = () => {
    withBusy(async () => {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: returnUrl,
      });
      if (result.error) return toast.error("Google sign-in failed.");
      if (result.redirected) return;
      navigate(afterAuth, { replace: true });
    });
  };

  return (
    <div className="relative overflow-hidden">
      <SeoHead
        title="Sign in — Big Data Intelligence Hub"
        description="Sign in to personalize your big data intelligence briefings, watchlists and saved searches."
        path="/auth"
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
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Welcome back</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                The dashboard stays free and public — signing in only adds personalization.
              </p>

              <Tabs defaultValue="signin" className="mt-5">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Sign up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="remember"
                          checked={remember}
                          onCheckedChange={(v) => setRemember(v === true)}
                        />
                        <Label htmlFor="remember" className="text-xs font-normal text-muted-foreground">
                          Remember me
                        </Label>
                      </div>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={busy}
                        className="text-xs text-primary underline-offset-4 transition-colors hover:underline disabled:opacity-50"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Button type="submit" className="w-full" disabled={busy}>Sign in</Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-up">Email</Label>
                      <Input id="email-up" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-up">Password</Label>
                      <Input id="password-up" type="password" autoComplete="new-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={busy}>Create account</Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-2.5">
                <Button variant="outline" className="w-full" onClick={handleMagicLink} disabled={busy}>
                  Email me a magic link
                </Button>
                <Button variant="secondary" className="w-full" onClick={handleGoogle} disabled={busy}>
                  Continue with Google
                </Button>
                <div className="grid grid-cols-2 gap-2.5">
                  <Button variant="outline" className="w-full" disabled title="Coming soon">
                    Microsoft
                  </Button>
                  <Button variant="outline" className="w-full" disabled title="Coming soon">
                    <Github className="mr-2 h-4 w-4" aria-hidden="true" /> GitHub
                  </Button>
                </div>
                <p className="text-center text-[11px] text-muted-foreground">
                  Microsoft and GitHub sign-in coming soon.
                </p>
              </div>
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
