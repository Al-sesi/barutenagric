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
  nin: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  passport_url: string | null;
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
    nin: "",
    account_number: "",
    account_name: "",
    bank_name: "",
  });
  const [passportFile, setPassportFile] = useState<File | null>(null);

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

    let passportUrl = null;

    // Upload passport if provided
    if (passportFile) {
      const fileExt = passportFile.name.split('.').pop();
      const fileName = `farmer_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('passports')
        .upload(filePath, passportFile);

      if (uploadError) {
        toast.error("Failed to upload passport");
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('passports')
        .getPublicUrl(filePath);
      
      passportUrl = publicUrl;
    }

    const { error } = await supabase.from("farmers").insert({
      ...formData,
      passport_url: passportUrl,
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
      nin: "",
      account_number: "",
      account_name: "",
      bank_name: "",
    });
    setPassportFile(null);
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading farmers...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="bg-primary/5">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <CardTitle className="text-lg md:text-xl text-primary">Farmer Registry</CardTitle>
            <CardDescription className="text-sm">
              {role === "general_admin" 
                ? "Register and manage farmers across all districts" 
                : "Register and view farmers in your district"}
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 w-full md:w-auto">Register Farmer</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] md:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">Register New Farmer</DialogTitle>
                <DialogDescription className="text-sm">Add a farmer to the registry</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm md:text-base">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="text-sm md:text-base">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary_crop" className="text-sm md:text-base">Primary Crop</Label>
                  <Input
                    id="primary_crop"
                    value={formData.primary_crop}
                    onChange={(e) => setFormData({ ...formData, primary_crop: e.target.value })}
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nin" className="text-sm md:text-base">NIN (National Identification Number)</Label>
                  <Input
                    id="nin"
                    value={formData.nin}
                    onChange={(e) => setFormData({ ...formData, nin: e.target.value })}
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_number" className="text-sm md:text-base">Account Number</Label>
                  <Input
                    id="account_number"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_name" className="text-sm md:text-base">Account Name</Label>
                  <Input
                    id="account_name"
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_name" className="text-sm md:text-base">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passport" className="text-sm md:text-base">Passport Photo</Label>
                  <Input
                    id="passport"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
                    className="h-12 cursor-pointer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district" className="text-sm md:text-base">District</Label>
                  <Select
                    value={formData.district}
                    onValueChange={(value) => setFormData({ ...formData, district: value })}
                    disabled={role === "sub_admin"}
                  >
                    <SelectTrigger className="h-12">
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
                <Button type="submit" className="w-full h-12">
                  Register Farmer
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="inline-block min-w-full align-middle">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Name</TableHead>
                  <TableHead className="whitespace-nowrap">Phone</TableHead>
                  <TableHead className="whitespace-nowrap">Primary Crop</TableHead>
                  <TableHead className="whitespace-nowrap">District</TableHead>
                  <TableHead className="whitespace-nowrap">Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farmers.map((farmer) => (
                  <TableRow key={farmer.id}>
                    <TableCell className="font-medium whitespace-nowrap">{farmer.full_name}</TableCell>
                    <TableCell className="whitespace-nowrap">{farmer.phone_number}</TableCell>
                    <TableCell className="whitespace-nowrap">{farmer.primary_crop}</TableCell>
                    <TableCell className="whitespace-nowrap">{farmer.district}</TableCell>
                    <TableCell className="whitespace-nowrap">{new Date(farmer.created_at).toLocaleDateString()}</TableCell>
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
