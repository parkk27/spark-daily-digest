import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import SeoHead from "@/components/SeoHead";
import { useEffect } from "react";

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/settings", { replace: true });
  }, [user, loading, navigate]);

  const withBusy = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const handleSignIn = (e: FormEvent) => {
    e.preventDefault();
    withBusy(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return toast.error(error.message);
      navigate("/settings", { replace: true });
    });
  };

  const handleSignUp = (e: FormEvent) => {
    e.preventDefault();
    withBusy(async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) return toast.error(error.message);
      if (!data.session) toast.success("Check your email to confirm your account.");
      else navigate("/settings", { replace: true });
    });
  };

  const handleMagicLink = () => {
    if (!email) return toast.error("Enter your email first.");
    withBusy(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) return toast.error(error.message);
      toast.success("Magic link sent — check your inbox.");
    });
  };

  const handleGoogle = () => {
    withBusy(async () => {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) return toast.error("Google sign-in failed.");
      if (result.redirected) return;
      navigate("/settings", { replace: true });
    });
  };

  return (
    <div className="container flex max-w-md flex-col justify-center py-16">
      <SeoHead
        title="Sign in — Big Data Intelligence Hub"
        description="Sign in to personalize your big data intelligence briefings, watchlists and saved searches."
        path="/auth"
      />
      <div className="mb-8 flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Sign in to personalize
        </h1>
      </div>

      <Tabs defaultValue="signin">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Create account</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <form onSubmit={handleSignIn} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>Sign in</Button>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email-up">Email</Label>
              <Input id="email-up" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-up">Password</Label>
              <Input id="password-up" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>Create account</Button>
          </form>
        </TabsContent>
      </Tabs>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-3">
        <Button variant="outline" className="w-full" onClick={handleMagicLink} disabled={busy}>
          Email me a magic link
        </Button>
        <Button variant="secondary" className="w-full" onClick={handleGoogle} disabled={busy}>
          Continue with Google
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        The dashboard stays free and public — signing in only adds personalization.
      </p>
    </div>
  );
};

export default AuthPage;
