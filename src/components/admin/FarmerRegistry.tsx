import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  nin: string | null;
  account_number: string | null;
  account_name: string | null;
  bank_name: string | null;
  passport_url: string | null;
  created_at: string | null;
}

const districts = ["Ilesha Baruba", "Gwanara", "Okuta", "Yashikira"];

interface FarmerRegistryProps {
  role?: "general_admin" | "sub_admin" | null;
  userDistrict?: string | null;
}

export default function FarmerRegistry({ role, userDistrict }: FarmerRegistryProps = {}) {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    try {
      let query = supabase.from("farmers").select("*").order("created_at", { ascending: false });
      
      if (role === "sub_admin" && userDistrict) {
        query = query.eq("district", userDistrict);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setFarmers(data || []);
    } catch (e) {
      console.error("Error fetching farmers:", e);
      toast.error("Failed to load farmers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, [role, userDistrict]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to register farmers");
        setSubmitting(false);
        return;
      }

      let passportUrl: string | null = null;

      // Upload passport photo if provided
      if (passportFile) {
        const fileExt = passportFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("farmer-passports")
          .upload(fileName, passportFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          // Continue without passport - don't block registration
        } else {
          const { data: urlData } = supabase.storage
            .from("farmer-passports")
            .getPublicUrl(fileName);
          passportUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from("farmers").insert({
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        primary_crop: formData.primary_crop,
        district: formData.district,
        nin: formData.nin || null,
        account_number: formData.account_number || null,
        account_name: formData.account_name || null,
        bank_name: formData.bank_name || null,
        passport_url: passportUrl,
        created_by: user.id,
      });

      if (error) throw error;

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
      fetchFarmers();
    } catch (e: any) {
      console.error("Registration error:", e);
      toast.error(e.message || "Failed to register farmer");
    } finally {
      setSubmitting(false);
    }
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_number" className="text-sm md:text-base">Account Number</Label>
                  <Input
                    id="account_number"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_name" className="text-sm md:text-base">Account Name</Label>
                  <Input
                    id="account_name"
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_name" className="text-sm md:text-base">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passport" className="text-sm md:text-base">Passport Photo (Optional)</Label>
                  <Input
                    id="passport"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
                    className="h-12 cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district" className="text-sm md:text-base">District</Label>
                  <Select
                    value={formData.district}
                    onValueChange={(value) => setFormData({ ...formData, district: value })}
                    disabled={role === "sub_admin"}
                    required
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
                <Button type="submit" className="w-full h-12" disabled={submitting}>
                  {submitting ? "Registering..." : "Register Farmer"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {farmers.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No farmers registered yet.</p>
        ) : (
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
                      <TableCell className="whitespace-nowrap">
                        {farmer.created_at ? new Date(farmer.created_at).toLocaleDateString() : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
