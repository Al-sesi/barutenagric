import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase, SUPABASE_ENABLED } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Leaf, 
  LogOut, 
  Home, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  MapPin,
  ExternalLink,
  Menu,
  X
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

// Import admin components
import FarmerRegistry from "@/components/admin/FarmerRegistry";
import IncomingOrders from "@/components/admin/IncomingOrders";
import DistrictManagement from "@/components/admin/DistrictManagement";

type UserRole = "general_admin" | "sub_admin" | null;

const Portal = () => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  // Stats state
  const [stats, setStats] = useState({
    totalFarmers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    assignedOrders: 0,
  });

  const fetchUserRole = async (userId: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, district")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setRole(data.role as UserRole);
        setDistrict(data.district ?? null);
      } else {
        // Fallback for default admin
        if (userEmail?.toLowerCase() === "barutemagriculture@gmail.com") {
          setRole("general_admin");
          setDistrict(null);
        } else {
          setRole(null);
          setDistrict(null);
        }
      }
    } catch (err) {
      console.error("Error fetching role:", err);
      if (userEmail?.toLowerCase() === "barutemagriculture@gmail.com") {
        setRole("general_admin");
      } else {
        setRole(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user || !role) return;

    try {
      // Fetch farmers count
      const farmersQuery = supabase.from("farmers").select("id", { count: "exact", head: true });
      if (role === "sub_admin" && district) {
        farmersQuery.eq("district", district);
      }
      const { count: farmersCount } = await farmersQuery;

      // Fetch orders stats
      const ordersQuery = supabase.from("inquiries").select("id, status", { count: "exact" });
      if (role === "sub_admin" && district) {
        ordersQuery.eq("assigned_district", district);
      }
      const { data: orders, count: ordersCount } = await ordersQuery;

      const pendingCount = orders?.filter(o => o.status === "new").length || 0;
      const assignedCount = orders?.filter(o => o.status === "assigned").length || 0;

      setStats({
        totalFarmers: farmersCount || 0,
        totalOrders: ordersCount || 0,
        pendingOrders: pendingCount,
        assignedOrders: assignedCount,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    if (!SUPABASE_ENABLED) {
      setLoading(false);
      return;
    }

    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchUserRole(currentUser.id, currentUser.email ?? undefined);
      } else {
        setLoading(false);
      }
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
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        setLoading(true);
        fetchUserRole(nextUser.id, nextUser.email ?? undefined);
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

  useEffect(() => {
    if (user && role) {
      fetchStats();
    }
  }, [user, role, district]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!SUPABASE_ENABLED) {
      toast({ title: "Error", description: "Authentication not configured", variant: "destructive" });
      return;
    }
    
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Success", description: "Logged in successfully" });
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setDistrict(null);
    toast({ title: "Logged out", description: "You have been signed out" });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <Leaf className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading portal...</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-primary/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Leaf className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">Admin Portal</CardTitle>
            <CardDescription>Baruten Agricultural Foundation</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              <Button type="submit" className="w-full h-12 text-lg" disabled={authLoading}>
                {authLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Link 
                to="/" 
                className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Visit Main Website
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access denied
  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-destructive/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this portal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleLogout} variant="outline" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
            <Link to="/">
              <Button variant="ghost" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Go to Main Website
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Leaf className="h-8 w-8" />
              <div>
                <h1 className="font-bold text-lg">Baruten Admin</h1>
                <p className="text-xs opacity-80 capitalize">
                  {role?.replace("_", " ")} {district ? `• ${district}` : ""}
                </p>
              </div>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-4">
              <Link 
                to="/" 
                className="text-sm opacity-80 hover:opacity-100 inline-flex items-center gap-1"
              >
                <ExternalLink className="h-4 w-4" />
                Main Site
              </Link>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleLogout}
                className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-primary-foreground/20 space-y-2">
              <Link 
                to="/" 
                className="block py-2 opacity-80 hover:opacity-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ExternalLink className="h-4 w-4 inline mr-2" />
                Main Website
              </Link>
              <button 
                onClick={handleLogout}
                className="block py-2 opacity-80 hover:opacity-100"
              >
                <LogOut className="h-4 w-4 inline mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4 hidden sm:block" />
              Overview
            </TabsTrigger>
            {role === "general_admin" && (
              <TabsTrigger value="orders" className="gap-2">
                <ShoppingCart className="h-4 w-4 hidden sm:block" />
                Orders
              </TabsTrigger>
            )}
            <TabsTrigger value="farmers" className="gap-2">
              <Users className="h-4 w-4 hidden sm:block" />
              Farmers
            </TabsTrigger>
            {role === "general_admin" && (
              <TabsTrigger value="districts" className="gap-2">
                <MapPin className="h-4 w-4 hidden sm:block" />
                Districts
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Farmers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{stats.totalFarmers}</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-accent">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.totalOrders}</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    New Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Assigned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">{stats.assignedOrders}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button onClick={() => setActiveTab("farmers")}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Farmers
                </Button>
                {role === "general_admin" && (
                  <>
                    <Button variant="outline" onClick={() => setActiveTab("orders")}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      View Orders
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab("districts")}>
                      <MapPin className="mr-2 h-4 w-4" />
                      Manage Districts
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab - General Admin Only */}
          {role === "general_admin" && (
            <TabsContent value="orders">
              <IncomingOrders />
            </TabsContent>
          )}

          {/* Farmers Tab */}
          <TabsContent value="farmers">
            <FarmerRegistry />
          </TabsContent>

          {/* Districts Tab - General Admin Only */}
          {role === "general_admin" && (
            <TabsContent value="districts">
              <DistrictManagement />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Portal;
