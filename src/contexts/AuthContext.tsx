import { createContext, useContext, useEffect, useState } from "react";
import { supabase, SUPABASE_ENABLED } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type UserRole = "general_admin" | "sub_admin" | null;

interface SubAdmin {
  id: string;
  email: string;
  password: string;
  phone: string;
  nin: string;
  passport_url?: string;
  district: string;
  name: string;
}

interface LocalSubAdminUser {
  id: string;
  email: string;
  name: string;
  district: string;
}

interface AuthContextType {
  user: SupabaseUser | LocalSubAdminUser | null;
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
const SUB_ADMINS_KEY = "baruten_sub_admins";

// General Admin hardcoded credentials
const GENERAL_ADMIN_EMAIL = "barutenagriculture@gmail.com";
const GENERAL_ADMIN_PASSWORD = "Baruten1010";

// Helper to load sub-admins from localStorage
const loadSubAdmins = (): SubAdmin[] => {
  try {
    const stored = localStorage.getItem(SUB_ADMINS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | LocalSubAdminUser | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const stored = localStorage.getItem(LOCAL_SESSION_KEY);
        if (stored) {
          const session = JSON.parse(stored);
          if (session.role === "general_admin") {
            setUser({ id: "general_admin", email: GENERAL_ADMIN_EMAIL, name: "General Admin", district: "" } as LocalSubAdminUser);
            setRole("general_admin");
            setDistrict(null);
            setUserName("General Admin");
          } else if (session.role === "sub_admin") {
            const subAdmins = loadSubAdmins();
            const subAdmin = subAdmins.find(sa => sa.id === session.id);
            if (subAdmin) {
              setUser({ id: subAdmin.id, email: subAdmin.email, name: subAdmin.name, district: subAdmin.district });
              setRole("sub_admin");
              setDistrict(subAdmin.district);
              setUserName(subAdmin.name);
            } else {
              localStorage.removeItem(LOCAL_SESSION_KEY);
            }
          }
        }
      } catch {
        localStorage.removeItem(LOCAL_SESSION_KEY);
      }
      setLoading(false);
      setInitialized(true);
    };

    // Run immediately, no async operations
    checkExistingSession();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    const emailLower = email.toLowerCase().trim();

    // 1. First check hardcoded General Admin credentials
    if (emailLower === GENERAL_ADMIN_EMAIL.toLowerCase() && password === GENERAL_ADMIN_PASSWORD) {
      const localUser: LocalSubAdminUser = {
        id: "general_admin",
        email: GENERAL_ADMIN_EMAIL,
        name: "General Admin",
        district: "",
      };
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ role: "general_admin", id: "general_admin" }));
      setUser(localUser);
      setRole("general_admin");
      setDistrict(null);
      setUserName("General Admin");
      return { error: null };
    }

    // 2. Check localStorage for Sub-Admin credentials
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
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ role: "sub_admin", id: matchingSubAdmin.id }));
      setUser(localUser);
      setRole("sub_admin");
      setDistrict(matchingSubAdmin.district);
      setUserName(matchingSubAdmin.name);
      return { error: null };
    }

    // 3. Fallback: Try Supabase auth for General Admin (backup)
    if (SUPABASE_ENABLED) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data.user) {
          // Check if it's the general admin email via Supabase
          if (data.user.email?.toLowerCase() === GENERAL_ADMIN_EMAIL.toLowerCase()) {
            const localUser: LocalSubAdminUser = {
              id: "general_admin",
              email: GENERAL_ADMIN_EMAIL,
              name: "General Admin",
              district: "",
            };
            localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ role: "general_admin", id: "general_admin" }));
            setUser(localUser);
            setRole("general_admin");
            setDistrict(null);
            setUserName("General Admin");
            return { error: null };
          }
        }
        // If Supabase auth succeeded but not for our admin, sign out
        if (data.user) {
          await supabase.auth.signOut();
        }
      } catch (e) {
        console.error("Supabase auth error:", e);
      }
    }

    return { error: new Error("Invalid credentials") };
  };

  const signOut = async () => {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    
    if (SUPABASE_ENABLED) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore Supabase signout errors
      }
    }
    
    setUser(null);
    setRole(null);
    setDistrict(null);
    setUserName(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, role, district, userName, loading, initialized, signIn, signOut }}
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

export { loadSubAdmins, SUB_ADMINS_KEY };
export type { SubAdmin };