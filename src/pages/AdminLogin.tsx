import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin-dashboard`
        }
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log("New user created:", data.user.id);
        
        // Auto-assign general_admin role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: data.user.id,
            role: "general_admin",
            district: null
          })
          .select()
          .single();

        if (roleError) {
          console.error("Role assignment error:", roleError);
          toast.error("Account created but role assignment failed. Please contact support.");
          setLoading(false);
          return;
        }

        console.log("Role assigned successfully:", roleData);

        // Automatically sign in after successful signup and role assignment
        toast.success("Account created successfully! Signing you in...");
        
        // Longer delay to ensure role is fully committed to database
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { error: signInError } = await signIn(email, password);
        
        if (signInError) {
          console.error("Auto sign-in error:", signInError);
          toast.error("Account created but auto sign-in failed. Please sign in manually.");
          setIsSignUp(false);
          setPassword("");
          setLoading(false);
          return;
        }

        console.log("Sign in successful, navigating to dashboard");
        toast.success("Login successful!");
        navigate("/admin-dashboard");
      }
      setLoading(false);
      return;
    }

    // Regular sign in
    const { error } = await signIn(email, password);

    if (error) {
      toast.error("Invalid credentials");
      setLoading(false);
      return;
    }

    toast.success("Login successful");
    navigate("/admin-dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-xl md:text-2xl font-bold text-primary">
            {isSignUp ? "Create Admin Account" : "Admin Portal"}
          </CardTitle>
          <CardDescription className="text-sm">Baruten Agricultural Portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm md:text-base">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@baruten.com"
                className="h-12"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm md:text-base">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12"
                required
              />
            </div>
            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? (isSignUp ? "Creating account..." : "Signing in...") : (isSignUp ? "Create Account" : "Sign In")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
            >
              {isSignUp ? "Already have an account? Sign in" : "Need to create an account? Sign up"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
