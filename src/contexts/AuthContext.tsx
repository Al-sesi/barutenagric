import { createContext, useContext, useEffect, useState } from "react";
import { supabase, SUPABASE_ENABLED } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type UserRole = "general_admin" | "sub_admin" | null;

interface AuthContextType {
  user: SupabaseUser | null;
  session: null;
  role: UserRole;
  district: string | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session] = useState<null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role,district")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setRole((data.role as UserRole) ?? null);
        setDistrict(data.district ?? null);
      } else {
        // Fallback: default admin by email even if role record missing
        const email = user?.email?.toLowerCase() ?? "";
        if (email === "barutemagriculture@gmail.com") {
          setRole("general_admin");
          setDistrict(null);
        } else {
          setRole(null);
          setDistrict(null);
        }
      }
    } catch (err) {
      console.error("Exception fetching user role:", err);
      // Graceful fallback for default admin
      const email = user?.email?.toLowerCase() ?? "";
      if (email === "barutemagriculture@gmail.com") {
        setRole("general_admin");
        setDistrict(null);
      } else {
        setRole(null);
        setDistrict(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!SUPABASE_ENABLED) {
      setUser(null);
      setRole(null);
      setDistrict(null);
      setLoading(false);
      setInitialized(true);
      return;
    }

    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setLoading(true);
        await fetchUserRole(currentUser.id);
      } else {
        setRole(null);
        setDistrict(null);
        setLoading(false);
      }
      setInitialized(true);
    };
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setRole(null);
        setDistrict(null);
        setLoading(false);
        return;
      }

      const nextUser = session?.user ?? user;
      setUser(nextUser);
      if (nextUser) {
        setLoading(true);
        fetchUserRole(nextUser.id);
      } else {
        setRole(null);
        setDistrict(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!SUPABASE_ENABLED) {
      return { error: new Error("Auth not configured") } as { error: Error };
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error } as { error: Error | null };
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Unknown auth error");
      return { error: err };
    }
  };

  const signOut = async () => {
    if (SUPABASE_ENABLED) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setRole(null);
    setDistrict(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, role, district, loading, initialized, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
