import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Menu } from "lucide-react";
import IncomingOrders from "@/components/admin/IncomingOrders";
import FarmerRegistry from "@/components/admin/FarmerRegistry";
import DistrictManagement from "@/components/admin/DistrictManagement";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AdminDashboard() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin-login");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin-login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!user || !role) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-2xl font-bold text-primary truncate">Baruten Admin Portal</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                {role === "general_admin" ? "General Administrator" : "Sub-Administrator"}
              </p>
            </div>
            <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={handleSignOut} className="shrink-0">
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
                  <SelectItem value="districts">District Management</SelectItem>
                )}
              </SelectContent>
            </Select>
          ) : (
            /* Desktop: Tab buttons */
            <TabsList className={`grid w-full ${role === "general_admin" ? "grid-cols-3" : "grid-cols-2"}`}>
              <TabsTrigger value="orders">Incoming Orders</TabsTrigger>
              <TabsTrigger value="farmers">Farmer Registry</TabsTrigger>
              {role === "general_admin" && (
                <TabsTrigger value="districts">District Management</TabsTrigger>
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
            <TabsContent value="districts" className="mt-4 md:mt-6">
              <DistrictManagement />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
