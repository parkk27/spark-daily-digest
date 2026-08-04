import { Navigate, useLocation } from "react-router-dom";
import { LogIn, UserPlus, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

const Skeleton = () => (
  <div className="container max-w-4xl space-y-4 py-12">
    <div className="h-8 w-1/3 animate-pulse rounded-md bg-secondary" />
    <div className="h-40 animate-pulse rounded-lg bg-secondary/60" />
    <div className="h-40 animate-pulse rounded-lg bg-secondary/40" />
  </div>
);

export const SignInGate = ({ next }: { next: string }) => {
  const navigate = useNavigate();
  const q = `?next=${encodeURIComponent(next)}`;
  return (
    <div className="container flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary/15">
        <Lock className="h-5 w-5 text-primary" aria-hidden="true" />
      </span>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        Please sign in to access Big Data Intelligence Hub.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Executive intelligence for the modern data ecosystem — free to join.
      </p>
      <div className="mt-6 flex gap-2.5">
        <Button onClick={() => navigate(`/signin${q}`)} className="gap-1.5">
          <LogIn className="h-4 w-4" /> Sign in
        </Button>
        <Button variant="outline" onClick={() => navigate(`/signup${q}`)} className="gap-1.5">
          <UserPlus className="h-4 w-4" /> Create account
        </Button>
      </div>
    </div>
  );
};

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const next = location.pathname + location.search;

  if (loading) return <Skeleton />;
  if (!user) return <Navigate to={`/signin?next=${encodeURIComponent(next)}`} replace state={{ gate: true }} />;
  return <>{children}</>;
};

export default RequireAuth;
