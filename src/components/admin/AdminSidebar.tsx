import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  UserCog,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  title: string;
  icon: React.ElementType;
  value: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { title: "Overview", icon: LayoutDashboard, value: "overview" },
  { title: "Incoming Orders", icon: ShoppingCart, value: "orders" },
  { title: "Farmer Registry", icon: Users, value: "farmers" },
  { title: "Sub-Admins", icon: UserCog, value: "subadmins", adminOnly: true },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { role, user, userName, signOut } = useAuth();

  const handleSignOut = async () => {
    // No route redirects: /barutehouse uses conditional rendering.
    await signOut();
  };

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || role === "general_admin"
  );

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-foreground">Barutem Admin</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {filteredItems.map((item) => (
          <button
            key={item.value}
            onClick={() => onTabChange(item.value)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
              activeTab === item.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">{item.title}</span>}
          </button>
        ))}
      </nav>

      {/* User info & Sign out */}
      <div className="p-4 border-t border-border space-y-3">
        {!collapsed && (
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground truncate">
              {userName || (user && 'email' in user ? user.email : 'Admin')}
            </p>
            <p className="capitalize">
              {role === "general_admin" ? "General Admin" : "Sub-Admin"}
            </p>
          </div>
        )}
        <Button
          variant="outline"
          size={collapsed ? "icon" : "default"}
          onClick={handleSignOut}
          className="w-full border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}
