import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import IncomingOrders from "@/components/admin/IncomingOrders";
import FarmerRegistry from "@/components/admin/FarmerRegistry";
import DistrictManagement from "@/components/admin/DistrictManagement";

export default function AdminDashboard() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();

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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">Baruten Admin Portal</h1>
            <p className="text-sm text-muted-foreground">
              {role === "general_admin" ? "General Administrator" : "Sub-Administrator"}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">Incoming Orders</TabsTrigger>
            <TabsTrigger value="farmers">Farmer Registry</TabsTrigger>
            {role === "general_admin" && (
              <TabsTrigger value="districts">District Management</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <IncomingOrders />
          </TabsContent>

          <TabsContent value="farmers" className="mt-6">
            <FarmerRegistry />
          </TabsContent>

          {role === "general_admin" && (
            <TabsContent value="districts" className="mt-6">
              <DistrictManagement />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
