import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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
  created_at: string;
}

const districts = ["Ilesha Baruba", "Gwanara", "Okuta", "Yashikira"];

export default function IncomingOrders() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();

  const fetchInquiries = async () => {
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load orders");
      return;
    }

    setInquiries(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchInquiries();

    const channel = supabase
      .channel("inquiries_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "inquiries" }, fetchInquiries)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAssignDistrict = async (inquiryId: string, district: string) => {
    const { error } = await supabase
      .from("inquiries")
      .update({ assigned_district: district, status: "assigned" })
      .eq("id", inquiryId);

    if (error) {
      toast.error("Failed to assign district");
      return;
    }

    toast.success("Order assigned successfully");
  };

  const handleMarkFulfilled = async (inquiryId: string) => {
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      new: "default",
      assigned: "secondary",
      fulfilled: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading orders...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-lg md:text-xl text-primary">Incoming Orders</CardTitle>
        <CardDescription className="text-sm">
          {role === "general_admin" 
            ? "Assign orders to districts and manage all incoming requests" 
            : "View and fulfill orders assigned to your district"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="inline-block min-w-full align-middle">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Buyer Name</TableHead>
                  <TableHead className="whitespace-nowrap">Crop</TableHead>
                  <TableHead className="whitespace-nowrap">Volume (MT)</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Assigned District</TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((inquiry) => (
                  <TableRow key={inquiry.id}>
                     <TableCell className="font-medium whitespace-nowrap">{inquiry.buyer_name}</TableCell>
                    <TableCell className="whitespace-nowrap">{inquiry.crop}</TableCell>
                    <TableCell className="whitespace-nowrap">{inquiry.volume_mt} MT</TableCell>
                    <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
                    <TableCell className="whitespace-nowrap">{inquiry.assigned_district || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{new Date(inquiry.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {role === "general_admin" && inquiry.status === "new" && (
                        <Select onValueChange={(value) => handleAssignDistrict(inquiry.id, value)}>
                          <SelectTrigger className="w-full min-w-[180px] h-10">
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
                      )}
                      {role === "sub_admin" && inquiry.status === "assigned" && (
                        <Button
                          onClick={() => handleMarkFulfilled(inquiry.id)}
                          size="sm"
                          className="h-10 w-full md:w-auto"
                        >
                          Mark Fulfilled
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
