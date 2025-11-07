import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Farmer {
  id: string;
  full_name: string;
  phone_number: string;
  primary_crop: string;
  district: string;
  created_at: string;
}

const districts = ["Ilesha Baruba", "Gwanara", "Okuta", "Yashikira"];

export default function FarmerRegistry() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { role, district: userDistrict, user } = useAuth();

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    primary_crop: "",
    district: userDistrict || "",
  });

  const fetchFarmers = async () => {
    const { data, error } = await supabase
      .from("farmers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load farmers");
      return;
    }

    setFarmers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFarmers();

    const channel = supabase
      .channel("farmers_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "farmers" }, fetchFarmers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("farmers").insert({
      ...formData,
      created_by: user?.id,
    });

    if (error) {
      toast.error("Failed to register farmer");
      return;
    }

    toast.success("Farmer registered successfully");
    setDialogOpen(false);
    setFormData({
      full_name: "",
      phone_number: "",
      primary_crop: "",
      district: userDistrict || "",
    });
  };

  if (loading) {
    return <p>Loading farmers...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Farmer Registry</CardTitle>
            <CardDescription>Manage local farmer database</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Register Farmer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register New Farmer</DialogTitle>
                <DialogDescription>Add a farmer to the registry</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary_crop">Primary Crop</Label>
                  <Input
                    id="primary_crop"
                    value={formData.primary_crop}
                    onChange={(e) => setFormData({ ...formData, primary_crop: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Select
                    value={formData.district}
                    onValueChange={(value) => setFormData({ ...formData, district: value })}
                    disabled={role === "sub_admin"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Register Farmer
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Primary Crop</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Registered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {farmers.map((farmer) => (
              <TableRow key={farmer.id}>
                <TableCell className="font-medium">{farmer.full_name}</TableCell>
                <TableCell>{farmer.phone_number}</TableCell>
                <TableCell>{farmer.primary_crop}</TableCell>
                <TableCell>{farmer.district}</TableCell>
                <TableCell>{new Date(farmer.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
