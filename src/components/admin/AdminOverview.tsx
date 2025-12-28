import { useEffect, useState } from "react";
import { supabase, SUPABASE_ENABLED } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingCart, Clock, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Stats {
  totalFarmers: number;
  verifiedFarmers: number;
  activeOrders: number;
  pendingAssignments: number;
  fulfilledOrders: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    totalFarmers: 0,
    verifiedFarmers: 0,
    activeOrders: 0,
    pendingAssignments: 0,
    fulfilledOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const { role, district } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      if (!SUPABASE_ENABLED) {
        setLoading(false);
        return;
      }

      try {
        // Fetch farmers stats
        let farmersQuery = supabase.from("farmers").select("id, verified", { count: "exact" });
        if (role === "sub_admin" && district) {
          farmersQuery = farmersQuery.eq("district", district);
        }
        const { data: farmersData, count: farmersCount } = await farmersQuery;
        
        const verifiedCount = farmersData?.filter(f => f.verified).length || 0;

        // Fetch orders stats
        let ordersQuery = supabase.from("inquiries").select("status", { count: "exact" });
        if (role === "sub_admin" && district) {
          ordersQuery = ordersQuery.eq("assigned_district", district);
        }
        const { data: ordersData } = await ordersQuery;

        const activeOrders = ordersData?.filter(o => o.status === "assigned").length || 0;
        const pendingAssignments = ordersData?.filter(o => o.status === "new").length || 0;
        const fulfilledOrders = ordersData?.filter(o => o.status === "fulfilled").length || 0;

        setStats({
          totalFarmers: farmersCount || 0,
          verifiedFarmers: verifiedCount,
          activeOrders,
          pendingAssignments,
          fulfilledOrders,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [role, district]);

  const statCards = [
    {
      title: "Total Farmers",
      value: stats.totalFarmers,
      subtitle: `${stats.verifiedFarmers} verified`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Orders",
      value: stats.activeOrders,
      subtitle: "Currently assigned",
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Pending Assignments",
      value: stats.pendingAssignments,
      subtitle: "Awaiting assignment",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Fulfilled Orders",
      value: stats.fulfilledOrders,
      subtitle: "Completed sales",
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground">
          {role === "general_admin" 
            ? "Monitor all districts and manage operations" 
            : `Managing ${district || "your district"}`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
