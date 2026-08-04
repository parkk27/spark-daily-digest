import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

const Skeleton = () => (
  <div className="container max-w-4xl space-y-4 py-12">
    <div className="h-8 w-1/3 animate-pulse rounded-md bg-secondary" />
    <div className="h-40 animate-pulse rounded-lg bg-secondary/60" />
    <div className="h-40 animate-pulse rounded-lg bg-secondary/40" />
  </div>
);

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const next = location.pathname + location.search;

  if (loading) return <Skeleton />;
  if (!user) return <Navigate to={`/signin?next=${encodeURIComponent(next)}`} replace />;
  return <>{children}</>;
};

export default RequireAuth;
