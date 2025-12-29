import { useMemo, useState } from "react";
import { useAuth, safeStorageClear } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminOverview from "@/components/admin/AdminOverview";
import EnhancedIncomingOrders from "@/components/admin/EnhancedIncomingOrders";
import EnhancedFarmerRegistry from "@/components/admin/EnhancedFarmerRegistry";
import SubAdminManagement from "@/components/admin/SubAdminManagement";

export default function AdminDashboard() {
  const { user, role, district, userName, signIn, signOut } = useAuth();
  const isMobile = useIsMobile();

  // Conditional rendering (no redirects): login vs dashboard.
  const isLoggedIn = useMemo(() => Boolean(user && role), [user, role]);

  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async () => {
    setLoginLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error("Invalid credentials. Please check your email and password.");
      setLoginLoading(false);
      return;
    }

    toast.success("Login successful");
    setEmail("");
    setPassword("");
    setLoginLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    toast.success("Signed out successfully");
  };

  const handleReset = () => {
    safeStorageClear();
    toast.success("Reset complete. Please sign in again.");
    // ensure UI returns to login state immediately
    void signOut();
  };

  // Show login form if not authenticated
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen overflow-x-hidden flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardHeader className="text-center space-y-2 pb-6">
            <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center mx-auto mb-2">
              <span className="text-primary-foreground font-bold text-2xl">B</span>
            </div>
            <CardTitle className="text-xl md:text-2xl font-bold text-primary">Admin Portal</CardTitle>
            <CardDescription className="text-sm md:text-base">Barutem Agricultural Portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleLogin();
              }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm md:text-base font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@barutem.com"
                    className="h-12 md:h-14 pl-10 text-base"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm md:text-base font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 md:h-14 pl-10 pr-12 text-base"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 md:h-14 text-base font-medium mt-2"
                disabled={loginLoading}
              >
                {loginLoading ? "Signing in..." : "Sign In"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full min-h-[44px]"
                onClick={handleReset}
              >
                Reset (Fix Loading)
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <AdminOverview />;
      case "orders":
        return <EnhancedIncomingOrders />;
      case "farmers":
        return <EnhancedFarmerRegistry role={role} userDistrict={district} />;
      case "subadmins":
        return role === "general_admin" ? <SubAdminManagement /> : null;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* Mobile Header */}
      {isMobile && (
        <>
          <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">B</span>
                </div>
                <span className="font-semibold text-foreground">Barutem Admin</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </header>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 bg-background/95 pt-16">
              <nav className="p-4 space-y-2">
                {[
                  { title: "Overview", value: "overview" },
                  { title: "Incoming Orders", value: "orders" },
                  { title: "Farmer Registry", value: "farmers" },
                  ...(role === "general_admin" ? [{ title: "Sub-Admins", value: "subadmins" }] : []),
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      setActiveTab(item.value);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 min-h-[44px] rounded-lg font-medium transition-colors ${
                      activeTab === item.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
                <div className="pt-4 border-t border-border mt-4">
                  <p className="text-sm text-muted-foreground px-4 mb-2">
                    {userName || (user && 'email' in user ? user.email : 'Admin')}
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="w-full min-h-[44px] border-destructive/50 text-destructive"
                  >
                    Sign Out
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Main Content */}
      <main className={`flex-1 ${isMobile ? "pt-16" : ""} overflow-x-hidden`}>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}