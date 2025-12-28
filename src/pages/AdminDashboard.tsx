import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminOverview from "@/components/admin/AdminOverview";
import EnhancedIncomingOrders from "@/components/admin/EnhancedIncomingOrders";
import EnhancedFarmerRegistry from "@/components/admin/EnhancedFarmerRegistry";
import SubAdminManagement from "@/components/admin/SubAdminManagement";
import MarketTrendsChart from "@/components/admin/MarketTrendsChart";

export default function AdminDashboard() {
  const { user, role, district, loading, initialized, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (initialized && !user) {
      navigate("/admin-login");
    }
    if (initialized && user && !role) {
      toast.error("No admin role assigned to this account. Please contact support.");
    }
  }, [initialized, user, role, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin-login");
  };

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md text-center space-y-4 p-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">No admin role assigned to this account. Please contact support.</p>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <AdminOverview />
            <MarketTrendsChart />
          </div>
        );
      case "orders":
        return <EnhancedIncomingOrders />;
      case "farmers":
        return <EnhancedFarmerRegistry role={role} userDistrict={district} />;
      case "subadmins":
        return role === "general_admin" ? <SubAdminManagement /> : null;
      case "analytics":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
              <p className="text-muted-foreground">Market trends and performance metrics</p>
            </div>
            <MarketTrendsChart />
          </div>
        );
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
                  { title: "Analytics", value: "analytics" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      setActiveTab(item.value);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                      activeTab === item.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
                <div className="pt-4 border-t border-border mt-4">
                  <p className="text-sm text-muted-foreground px-4 mb-2">{user?.email}</p>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="w-full border-destructive/50 text-destructive"
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
      <main className={`flex-1 ${isMobile ? "pt-16" : ""}`}>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
