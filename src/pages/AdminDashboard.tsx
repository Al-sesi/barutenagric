import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Menu } from "lucide-react";
import { toast } from "sonner";
import IncomingOrders from "@/components/admin/IncomingOrders";
import FarmerRegistry from "@/components/admin/FarmerRegistry";
import SubAdminManagement from "@/components/admin/SubAdminManagement";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AdminDashboard() {
  const { user, role, loading, initialized, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("orders");

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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <p className="text-lg">No admin role assigned to this account. Please contact support.</p>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-secondary bg-card shadow-lg">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex justify-between items-center gap-2 md:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-base md:text-2xl font-bold text-primary truncate">
                Baruten Agricultural Portal - Admin
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {user?.email || "admin@baruten.com"}
              </p>
              <p className="text-xs text-secondary font-medium">
                {role === "general_admin" ? "General Administrator" : "Sub-Administrator"}
              </p>
            </div>
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"} 
              onClick={handleSignOut} 
              className="shrink-0 border-primary hover:bg-primary hover:text-primary-foreground"
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile: Dropdown selector */}
          {isMobile ? (
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full mb-4 h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orders">Incoming Orders</SelectItem>
                <SelectItem value="farmers">Farmer Registry</SelectItem>
                {role === "general_admin" && (
                  <SelectItem value="subadmins">Sub-Admin Management</SelectItem>
                )}
              </SelectContent>
            </Select>
          ) : (
            /* Desktop: Tab buttons */
            <TabsList className={`grid w-full ${role === "general_admin" ? "grid-cols-3" : "grid-cols-2"}`}>
              <TabsTrigger value="orders">Incoming Orders</TabsTrigger>
              <TabsTrigger value="farmers">Farmer Registry</TabsTrigger>
              {role === "general_admin" && (
                <TabsTrigger value="subadmins">Sub-Admin Management</TabsTrigger>
              )}
            </TabsList>
          )}

          <TabsContent value="orders" className="mt-4 md:mt-6">
            <IncomingOrders />
          </TabsContent>

          <TabsContent value="farmers" className="mt-4 md:mt-6">
            <FarmerRegistry />
          </TabsContent>

          {role === "general_admin" && (
            <TabsContent value="subadmins" className="mt-4 md:mt-6">
              <SubAdminManagement />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
