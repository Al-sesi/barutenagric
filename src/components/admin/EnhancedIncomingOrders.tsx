import { useEffect, useState } from "react";
import { supabase, SUPABASE_ENABLED } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

interface Inquiry {
  id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  crop: string;
  volume_mt: number;
  message: string | null;
  status: string;
  assigned_district: string | null;
  assigned_to: string | null;
  created_at: string;
}

const districts = ["Ilesha Baruba", "Gwanara", "Okuta", "Yashikira"];

const subAdminRoles = [
  { name: "Logistics Head", role: "logistics" },
  { name: "Field Officer", role: "field" },
  { name: "Quality Inspector", role: "quality" },
  { name: "District Coordinator", role: "coordinator" },
];

export default function EnhancedIncomingOrders() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const { role } = useAuth();

  const fetchInquiries = async () => {
    try {
      if (!SUPABASE_ENABLED) {
        throw new Error("Supabase not configured");
      }
      const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setInquiries(data || []);
    } catch (e) {
      toast.error("Orders not accessible. Ensure database policies allow admin read.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "general_admin") {
      if (!SUPABASE_ENABLED) {
        setLoading(false);
        toast.error("Orders not accessible. Backend is not configured.");
        return;
      }
      fetchInquiries();
      const channel = supabase
        .channel("inquiries_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "inquiries" }, fetchInquiries)
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [role]);

  const handleAssignDistrict = async (inquiryId: string, district: string) => {
    if (!SUPABASE_ENABLED) {
      toast.error("Backend is not configured");
      return;
    }
    const { error } = await supabase
      .from("inquiries")
      .update({ assigned_district: district, status: "assigned" })
      .eq("id", inquiryId);

    if (error) {
      toast.error("Failed to assign district");
      return;
    }

    toast.success("Order assigned to district successfully");
  };

  const handleAssignToSubAdmin = async (subAdminName: string) => {
    if (!selectedInquiry || !SUPABASE_ENABLED) return;

    const { error } = await supabase
      .from("inquiries")
      .update({ 
        assigned_to: subAdminName, 
        status: "assigned" 
      })
      .eq("id", selectedInquiry.id);

    if (error) {
      toast.error("Failed to assign to sub-admin");
      return;
    }

    toast.success(`Order assigned to ${subAdminName}`);
    setAssignDialogOpen(false);
    setSelectedInquiry(null);
  };

  const handleMarkFulfilled = async (inquiryId: string) => {
    if (!SUPABASE_ENABLED) {
      toast.error("Backend is not configured");
      return;
    }
    const { error } = await supabase
      .from("inquiries")
      .update({ status: "fulfilled" })
      .eq("id", inquiryId);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    toast.success("Order marked as fulfilled");
  };

  const getStatusBadge = (inquiry: Inquiry) => {
    if (inquiry.status === "fulfilled") {
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">FULFILLED</Badge>;
    }
    if (inquiry.assigned_to) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
          Assigned to {inquiry.assigned_to}
        </Badge>
      );
    }
    if (inquiry.status === "assigned") {
      return <Badge variant="secondary">ASSIGNED</Badge>;
    }
    return <Badge variant="default">NEW</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading orders...</p>
        </CardContent>
      </Card>
    );
  }

  if (role !== "general_admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Incoming Orders</CardTitle>
          <CardDescription>
            Order assignment is handled centrally. Please manage farmers in your district.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This section is restricted to General Admins.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Inquiries</CardTitle>
        <CardDescription>
          Assign orders to districts and sub-admins, track all incoming requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Crop</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No orders yet
                  </TableCell>
                </TableRow>
              ) : (
                inquiries.map((inquiry) => (
                  <TableRow key={inquiry.id}>
                    <TableCell className="font-medium">{inquiry.buyer_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{inquiry.buyer_phone}</p>
                        <p className="text-muted-foreground">{inquiry.buyer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{inquiry.crop}</TableCell>
                    <TableCell>{inquiry.volume_mt} MT</TableCell>
                    <TableCell>{getStatusBadge(inquiry)}</TableCell>
                    <TableCell>{inquiry.assigned_district || "—"}</TableCell>
                    <TableCell>{new Date(inquiry.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {inquiry.status === "new" && (
                          <>
                            <Select onValueChange={(value) => handleAssignDistrict(inquiry.id, value)}>
                              <SelectTrigger className="w-[160px] h-9">
                                <SelectValue placeholder="Assign District" />
                              </SelectTrigger>
                              <SelectContent>
                                {districts.map((district) => (
                                  <SelectItem key={district} value={district}>
                                    {district}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Dialog open={assignDialogOpen && selectedInquiry?.id === inquiry.id} onOpenChange={(open) => {
                              setAssignDialogOpen(open);
                              if (!open) setSelectedInquiry(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedInquiry(inquiry)}
                                  className="w-[160px]"
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Assign to Sub-Admin
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Assign Order to Sub-Admin</DialogTitle>
                                  <DialogDescription>
                                    Select a sub-admin role to handle this order from {inquiry.buyer_name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-3 py-4">
                                  {subAdminRoles.map((sa) => (
                                    <Button
                                      key={sa.role}
                                      variant="outline"
                                      className="justify-start h-12"
                                      onClick={() => handleAssignToSubAdmin(sa.name)}
                                    >
                                      <UserPlus className="h-4 w-4 mr-2" />
                                      {sa.name}
                                    </Button>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                        {inquiry.status === "assigned" && !inquiry.assigned_to && (
                          <Dialog open={assignDialogOpen && selectedInquiry?.id === inquiry.id} onOpenChange={(open) => {
                            setAssignDialogOpen(open);
                            if (!open) setSelectedInquiry(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedInquiry(inquiry)}
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Assign to Sub-Admin
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assign Order to Sub-Admin</DialogTitle>
                                <DialogDescription>
                                  Select a sub-admin role to handle this order
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-3 py-4">
                                {subAdminRoles.map((sa) => (
                                  <Button
                                    key={sa.role}
                                    variant="outline"
                                    className="justify-start h-12"
                                    onClick={() => handleAssignToSubAdmin(sa.name)}
                                  >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    {sa.name}
                                  </Button>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {inquiry.status === "assigned" && (
                          <Button
                            onClick={() => handleMarkFulfilled(inquiry.id)}
                            size="sm"
                            variant="default"
                          >
                            Mark Fulfilled
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
