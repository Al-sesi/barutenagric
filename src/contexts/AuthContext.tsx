import { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/integrations/firebase/client";

type UserRole = "general_admin" | "sub_admin" | null;

interface AuthContextType {
  user: FirebaseUser | null;
  session: null;
  role: UserRole;
  district: string | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [session] = useState<null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchUserRole = async (userId: string) => {
    try {
      const ref = doc(firestore, "roles", userId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as { role?: string; district?: string };
        setRole((data.role as UserRole) ?? null);
        setDistrict(data.district ?? null);
      } else {
        setRole(null);
        setDistrict(null);
      }
      setLoading(false);
    } catch (err) {
      console.error("Exception fetching user role:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (fbUser) => {
      setUser(fbUser ?? null);
      if (fbUser) {
        setLoading(true);
        fetchUserRole(fbUser.uid);
      } else {
        setRole(null);
        setDistrict(null);
        setLoading(false);
      }
      setInitialized(true);
    });

    return () => unsub();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      return { error: null };
    } catch (error) {
      return { error } as { error: any };
    }
  };

  const signOut = async () => {
    await fbSignOut(firebaseAuth);
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
