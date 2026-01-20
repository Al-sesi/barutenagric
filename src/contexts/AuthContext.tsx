import { createContext, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
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

// Mobile-safe storage helpers (some mobile browsers can throw on localStorage access).
const safeStorageGet = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeStorageSet = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

const safeStorageRemove = (key: string) => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

const safeStorageClear = () => {
  try {
    window.localStorage.clear();
  } catch {
    // ignore
  }
};

// Helper to load sub-admins from localStorage
const loadSubAdmins = (): SubAdmin[] => {
  try {
    const stored = safeStorageGet(SUB_ADMINS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

type LocalSession =
  | { role: "general_admin"; id: "general_admin" }
  | { role: "sub_admin"; id: string };

const readLocalSession = (): {
  user: LocalSubAdminUser | null;
  role: UserRole;
  district: string | null;
  userName: string | null;
} => {
  try {
    const stored = safeStorageGet(LOCAL_SESSION_KEY);
    if (!stored) return { user: null, role: null, district: null, userName: null };

    const session = JSON.parse(stored) as LocalSession;

    if (session.role === "general_admin") {
      return {
        user: { id: "general_admin", email: GENERAL_ADMIN_EMAIL, name: "General Admin", district: "" },
        role: "general_admin",
        district: null,
        userName: "General Admin",
      };
    }

    const subAdmin = loadSubAdmins().find((sa) => sa.id === session.id);
    if (!subAdmin) {
      safeStorageRemove(LOCAL_SESSION_KEY);
      return { user: null, role: null, district: null, userName: null };
    }

    return {
      user: { id: subAdmin.id, email: subAdmin.email, name: subAdmin.name, district: subAdmin.district },
      role: "sub_admin",
      district: subAdmin.district,
      userName: subAdmin.name,
    };
  } catch {
    safeStorageRemove(LOCAL_SESSION_KEY);
    return { user: null, role: null, district: null, userName: null };
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Synchronous session hydration (prevents "Loading" hangs on mobile).
  const initial = useMemo(() => readLocalSession(), []);

  const [user, setUser] = useState<SupabaseUser | LocalSubAdminUser | null>(initial.user);
  const [role, setRole] = useState<UserRole>(initial.role);
  const [district, setDistrict] = useState<string | null>(initial.district);
  const [userName, setUserName] = useState<string | null>(initial.userName);

  // Keep these for compatibility with existing UI (but never block rendering).
  const [loading] = useState(false);
  const [initialized] = useState(true);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    const emailLower = email.toLowerCase().trim();

    // 1) Hardcoded General Admin credentials (instant)
    if (emailLower === GENERAL_ADMIN_EMAIL.toLowerCase() && password === GENERAL_ADMIN_PASSWORD) {
      const localUser: LocalSubAdminUser = {
        id: "general_admin",
        email: GENERAL_ADMIN_EMAIL,
        name: "General Admin",
        district: "",
      };

      safeStorageSet(
        LOCAL_SESSION_KEY,
        JSON.stringify({ role: "general_admin", id: "general_admin" })
      );

      setUser(localUser);
      setRole("general_admin");
      setDistrict(null);
      setUserName("General Admin");
      return { error: null };
    }

    // 2) Local sub-admin credentials (instant)
    const matchingSubAdmin = loadSubAdmins().find(
      (sa) => sa.email.toLowerCase() === emailLower && sa.password === password
    );

    if (matchingSubAdmin) {
      const localUser: LocalSubAdminUser = {
        id: matchingSubAdmin.id,
        email: matchingSubAdmin.email,
        name: matchingSubAdmin.name,
        district: matchingSubAdmin.district,
      };

      safeStorageSet(
        LOCAL_SESSION_KEY,
        JSON.stringify({ role: "sub_admin", id: matchingSubAdmin.id })
      );

      setUser(localUser);
      setRole("sub_admin");
      setDistrict(matchingSubAdmin.district);
      setUserName(matchingSubAdmin.name);
      return { error: null };
    }

    // 3) Optional backend auth fallback (do not block UI on mobile)
    if (SUPABASE_ENABLED) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data.user?.email?.toLowerCase() === GENERAL_ADMIN_EMAIL.toLowerCase()) {
          const localUser: LocalSubAdminUser = {
            id: "general_admin",
            email: GENERAL_ADMIN_EMAIL,
            name: "General Admin",
            district: "",
          };

          safeStorageSet(
            LOCAL_SESSION_KEY,
            JSON.stringify({ role: "general_admin", id: "general_admin" })
          );

          setUser(localUser);
          setRole("general_admin");
          setDistrict(null);
          setUserName("General Admin");
          return { error: null };
        }

        // If backend auth succeeded but not for our admin, immediately sign out
        if (data.user) await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }

    return { error: new Error("Invalid credentials") };
  };

  const signOut = async () => {
    safeStorageRemove(LOCAL_SESSION_KEY);

    if (SUPABASE_ENABLED) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }

    setUser(null);
    setRole(null);
    setDistrict(null);
    setUserName(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, district, userName, loading, initialized, signIn, signOut }}>
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

export { loadSubAdmins, SUB_ADMINS_KEY, safeStorageClear };
export type { SubAdmin };