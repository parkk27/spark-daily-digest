import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { authLog } from "@/lib/authLog";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** True when a previously active session ended (expired or signed out elsewhere). */
  expired: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  expired: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const hadSession = useRef(false);

  useEffect(() => {
    const apply = (s: Session | null) => {
      if (s) {
        hadSession.current = true;
        setExpired(false);
      } else if (hadSession.current) {
        hadSession.current = false;
        setExpired(true);
      }
      setSession(s);
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => apply(s));
    supabase.auth.getSession().then(({ data }) => apply(data.session));

    // Cross-tab synchronization: react to auth storage writes from other tabs.
    const onStorage = (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith("sb-") || !e.key.includes("auth-token")) return;
      supabase.auth.getSession().then(({ data }) => apply(data.session));
    };
    window.addEventListener("storage", onStorage);

    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const signOut = async () => {
    hadSession.current = false;
    authLog("sign_out");
    await supabase.auth.signOut();
    setExpired(false);
  };

  return (
    <AuthContext.Provider
      value={{ user: session?.user ?? null, session, loading, expired, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
