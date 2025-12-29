import { createContext, useContext, useEffect, useState } from "react";
import { supabase, SUPABASE_ENABLED } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { loadSubAdmins, SubAdmin } from "@/components/admin/SubAdminManagement";

type UserRole = "general_admin" | "sub_admin" | null;

interface LocalSubAdminUser {
  id: string;
  email: string;
  name: string;
  district: string;
}

interface AuthContextType {
  user: SupabaseUser | LocalSubAdminUser | null;
  session: null;
  role: UserRole;
  district: string | null;
  userName: string | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_SESSION_KEY = "baruten_local_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | LocalSubAdminUser | null>(null);
  const [session] = useState<null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchUserRole = async (userId: string, userEmail?: string) => {
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
        const email = userEmail?.toLowerCase() ?? "";
        if (email === "barutenagriculture@gmail.com") {
          setRole("general_admin");
          setDistrict(null);
          setUserName("General Admin");
        } else {
          setRole(null);
          setDistrict(null);
        }
      }
    } catch (err) {
      console.error("Exception fetching user role:", err);
      // Graceful fallback for default admin
      const email = userEmail?.toLowerCase() ?? "";
      if (email === "barutenagriculture@gmail.com") {
        setRole("general_admin");
        setDistrict(null);
        setUserName("General Admin");
      } else {
        setRole(null);
        setDistrict(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check for locally stored sub-admin session
  const checkLocalSession = () => {
    try {
      const stored = localStorage.getItem(LOCAL_SESSION_KEY);
      if (stored) {
        const localUser = JSON.parse(stored) as LocalSubAdminUser;
        // Verify this sub-admin still exists
        const subAdmins = loadSubAdmins();
        const exists = subAdmins.find(sa => sa.id === localUser.id);
        if (exists) {
          setUser(localUser);
          setRole("sub_admin");
          setDistrict(localUser.district);
          setUserName(localUser.name);
          return true;
        } else {
          localStorage.removeItem(LOCAL_SESSION_KEY);
        }
      }
    } catch {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
    return false;
  };

  useEffect(() => {
    if (!SUPABASE_ENABLED) {
      // Check for local sub-admin session first
      checkLocalSession();
      setLoading(false);
      setInitialized(true);
      return;
    }

    const init = async () => {
      // Check for local sub-admin session first
      if (checkLocalSession()) {
        setLoading(false);
        setInitialized(true);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setLoading(true);
        await fetchUserRole(currentUser.id, currentUser.email ?? undefined);
        if (currentUser.email?.toLowerCase() === "barutenagriculture@gmail.com") {
          setUserName("General Admin");
        }
      } else {
        setRole(null);
        setDistrict(null);
        setLoading(false);
      }
      setInitialized(true);
    };
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // If we have a local session, ignore Supabase auth changes
      const hasLocalSession = localStorage.getItem(LOCAL_SESSION_KEY);
      if (hasLocalSession) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setRole(null);
        setDistrict(null);
        setUserName(null);
        setLoading(false);
        return;
      }

      const nextUser = session?.user ?? user;
      if (nextUser && 'email' in nextUser) {
        setUser(nextUser as SupabaseUser);
        setLoading(true);
        fetchUserRole((nextUser as SupabaseUser).id, (nextUser as SupabaseUser).email ?? undefined);
        if ((nextUser as SupabaseUser).email?.toLowerCase() === "barutenagriculture@gmail.com") {
          setUserName("General Admin");
        }
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
    const emailLower = email.toLowerCase().trim();

    // First check if this is a local sub-admin
    const subAdmins = loadSubAdmins();
    const matchingSubAdmin = subAdmins.find(
      sa => sa.email.toLowerCase() === emailLower && sa.password === password
    );

    if (matchingSubAdmin) {
      const localUser: LocalSubAdminUser = {
        id: matchingSubAdmin.id,
        email: matchingSubAdmin.email,
        name: matchingSubAdmin.name,
        district: matchingSubAdmin.district,
      };
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localUser));
      setUser(localUser);
      setRole("sub_admin");
      setDistrict(matchingSubAdmin.district);
      setUserName(matchingSubAdmin.name);
      setLoading(false);
      return { error: null };
    }

    // If not a local sub-admin, try Supabase auth (for General Admin)
    if (!SUPABASE_ENABLED) {
      return { error: new Error("Invalid credentials") };
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
    // Clear local session
    localStorage.removeItem(LOCAL_SESSION_KEY);

    if (SUPABASE_ENABLED) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setRole(null);
    setDistrict(null);
    setUserName(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, role, district, userName, loading, initialized, signIn, signOut }}
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