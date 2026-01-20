import { useEffect, useState, useCallback } from "react";
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
import { loadSubAdmins, SubAdmin } from "./SubAdminManagement";
import { useIsMobile } from "@/hooks/use-mobile";
import OrderCard from "./OrderCard";

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

export default function EnhancedIncomingOrders() {
  const isMobile = useIsMobile();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const { role, userName, district } = useAuth();

  // Load sub-admins from localStorage
  useEffect(() => {
    const loaded = loadSubAdmins();
    setSubAdmins(loaded);
  }, [assignDialogOpen]); // Refresh when dialog opens

  const fetchInquiries = useCallback(async () => {
    try {
      if (!SUPABASE_ENABLED) {
        throw new Error("Supabase not configured");
      }
      
      let query = supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      
      // Sub-admins only see orders assigned to their district
      if (role === "sub_admin" && district) {
        query = query.eq("assigned_district", district);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setInquiries(data || []);
    } catch (e) {
      toast.error("Orders not accessible. Ensure database policies allow admin read.");
    } finally {
      setLoading(false);
    }
  }, [role, district]);

  useEffect(() => {
    if (role === "general_admin" || role === "sub_admin") {
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
  }, [role, fetchInquiries]);

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

    const subAdmin = subAdmins.find(s => s.name === subAdminName);
    const updateData: { assigned_to: string; status: string; assigned_district?: string } = { 
      assigned_to: subAdminName, 
      status: "assigned" 
    };

    if (subAdmin) {
      updateData.assigned_district = subAdmin.district;
    }

    const { error } = await supabase
      .from("inquiries")
      .update(updateData)
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

  if (!role || (role !== "general_admin" && role !== "sub_admin")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Incoming Orders</CardTitle>
          <CardDescription>
            You don't have permission to view orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This section is restricted to admins.</p>
        </CardContent>
      </Card>
    );
  }

  const isSubAdmin = role === "sub_admin";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isSubAdmin ? "My Assigned Orders" : "Recent Inquiries"}
        </CardTitle>
        <CardDescription>
          {isSubAdmin 
            ? `Orders assigned to ${userName}. Update status when fulfilled.`
            : "Assign orders to districts and sub-admins, track all incoming requests"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {inquiries.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No orders yet</p>
        ) : isMobile ? (
          // Mobile Card Layout
          <div className="grid gap-4">
            {inquiries.map((inquiry) => (
              <OrderCard
                key={inquiry.id}
                inquiry={inquiry}
                isSubAdmin={isSubAdmin}
                districts={districts}
                onAssignDistrict={handleAssignDistrict}
                onOpenAssignDialog={(inq) => {
                  setSelectedInquiry(inq);
                  setAssignDialogOpen(true);
                }}
                onMarkFulfilled={handleMarkFulfilled}
              />
            ))}
          </div>
        ) : (
          // Desktop Table Layout
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
                {inquiries.map((inquiry) => (
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
                        {!isSubAdmin && inquiry.status === "new" && (
                          <>
                            <Select onValueChange={(value) => handleAssignDistrict(inquiry.id, value)}>
                              <SelectTrigger className="w-[160px] h-11">
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
                            <Button 
                              variant="outline" 
                              className="w-[160px] h-11"
                              onClick={() => {
                                setSelectedInquiry(inquiry);
                                setAssignDialogOpen(true);
                              }}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Assign to Sub-Admin
                            </Button>
                          </>
                        )}
                        {!isSubAdmin && inquiry.status === "assigned" && !inquiry.assigned_to && (
                          <Button 
                            variant="outline" 
                            className="h-11"
                            onClick={() => {
                              setSelectedInquiry(inquiry);
                              setAssignDialogOpen(true);
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign to Sub-Admin
                          </Button>
                        )}
                        {(inquiry.status === "assigned" || (isSubAdmin && inquiry.assigned_to)) && inquiry.status !== "fulfilled" && (
                          <Button
                            onClick={() => handleMarkFulfilled(inquiry.id)}
                            className="h-11"
                          >
                            Mark Fulfilled
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Assign to Sub-Admin Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={(open) => {
          setAssignDialogOpen(open);
          if (!open) setSelectedInquiry(null);
        }}>
          <DialogContent className="max-w-[95vw] md:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Order to Sub-Admin</DialogTitle>
              <DialogDescription>
                Select a sub-admin to handle this order{selectedInquiry ? ` from ${selectedInquiry.buyer_name}` : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              {subAdmins.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No sub-admins created yet. Go to "Sub-Admins" tab to create one.
                </p>
              ) : (
                subAdmins.map((sa) => (
                  <Button
                    key={sa.id}
                    variant="outline"
                    className="justify-start h-12"
                    onClick={() => handleAssignToSubAdmin(sa.name)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {sa.name} ({sa.district})
                  </Button>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
