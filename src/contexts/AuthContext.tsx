import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type UserRole = "general_admin" | "sub_admin" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  district: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      console.log("Fetching role for user:", userId);
      
      // Add delay to ensure role is committed to database
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, district")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        setRole(null);
        setDistrict(null);
        setLoading(false);
        return;
      }

      if (data) {
        console.log("User role fetched successfully:", data);
        setRole(data.role as UserRole);
        setDistrict(data.district);
      } else {
        console.log("No role found for user");
        setRole(null);
        setDistrict(null);
      }
      setLoading(false);
    } catch (err) {
      console.error("Exception fetching user role:", err);
      setRole(null);
      setDistrict(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for existing session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setLoading(true);
          fetchUserRole(session.user.id);
        } else {
          setRole(null);
          setDistrict(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setDistrict(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, role, district, loading, signIn, signOut }}
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
