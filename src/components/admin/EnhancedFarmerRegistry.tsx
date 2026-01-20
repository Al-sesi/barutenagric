import { useEffect, useState, useCallback } from "react";
import { supabase, SUPABASE_ENABLED } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, CheckCircle, XCircle, UserPlus } from "lucide-react";
import { loadSubAdmins } from "./SubAdminManagement";
import { useIsMobile } from "@/hooks/use-mobile";
import FarmerCard from "./FarmerCard";

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
  created_by: string | null;
  verified: boolean;
}

const districts = ["Ilesha Baruba", "Gwanara", "Okuta", "Yashikira"];

interface EnhancedFarmerRegistryProps {
  role?: "general_admin" | "sub_admin" | null;
  userDistrict?: string | null;
}

export default function EnhancedFarmerRegistry({ role, userDistrict }: EnhancedFarmerRegistryProps = {}) {
  const { user, userName } = useAuth();
  const isMobile = useIsMobile();
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

  const fetchFarmers = useCallback(async () => {
    if (!SUPABASE_ENABLED || !supabase) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase.from("farmers").select("*").order("created_at", { ascending: false });
      
      if (role === "sub_admin" && userDistrict) {
        query = query.eq("district", userDistrict);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setFarmers((data as Farmer[]) || []);
    } catch (e) {
      console.error("Error fetching farmers:", e);
      toast.error("Failed to load farmers");
    } finally {
      setLoading(false);
    }
  }, [role, userDistrict]);

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  // Add state for error display
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setRegistrationError(null);

    try {if (!SUPABASE_ENABLED || !supabase) {
      toast.error("Database connection not configured");
      setSubmitting(false);
      return;
    }

    try {
      // Get the user ID - could be from Supabase auth or local sub-admin
      let userId: string | null = null;
      
      // Check if user is from local auth (sub-admin)
      if (user && 'id' in user) {
        userId = user.id;
      }
      
      // If not from local, try Supabase auth
      if (!userId) {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        userId = supabaseUser?.id ?? null;
      }
      
      if (!userId) {
        toast.error("You must be logged in to register farmers");
        setSubmitting(false);
        return;
      }

      // Fix for hardcoded admin: "general_admin" is not a valid UUID
      // If the database expects a UUID, we should send null or a nil UUID
      if (userId === "general_admin") {
        console.warn("Using 'general_admin' as ID. This may fail if DB expects UUID. Converting to null.");
        userId = null; 
      }

      let passportUrl: string | null = null;

      if (passportFile) {
        const fileExt = passportFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("passports")
          .upload(fileName, passportFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from("passports")
            .getPublicUrl(fileName);
          passportUrl = urlData.publicUrl;
        }
      }

      // Prepare farmer data object
      const farmerData: any = {
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        primary_crop: formData.primary_crop,
        district: formData.district,
        nin: formData.nin || null,
        account_number: formData.account_number || null,
        account_name: formData.account_name || null,
        bank_name: formData.bank_name || null,
        passport_url: passportUrl,
        verified: false,
      };

      // Only add created_by if we have a valid UUID
      if (userId) {
        farmerData.created_by = userId;
      }

      const { error } = await supabase.from("farmers").insert(farmerData);

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
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
      fetchFarmers();
    } catch (e: any) {
      console.error("Registration error:", e);
      // Show more detailed error message
      const errorMessage = e?.message || e?.error_description || "Failed to register farmer";
      const errorDetails = e?.details ? ` (${e.details})` : "";
      const fullError = `${errorMessage}${errorDetails}`;
      setRegistrationError(fullError);
      toast.error(fullError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVerified = async (farmerId: string, currentStatus: boolean) => {
    if (!SUPABASE_ENABLED || !supabase) {
      toast.error("Backend is not configured");
      return;
    }

    const { error } = await supabase
      .from("farmers")
      .update({ verified: !currentStatus })
      .eq("id", farmerId);

    if (error) {
      toast.error("Failed to update verification status");
      return;
    }

    toast.success(currentStatus ? "Verification removed" : "Farmer verified successfully");
    fetchFarmers();
  };

  const exportToCSV = () => {
    if (farmers.length === 0) {
      toast.error("No farmers to export");
      return;
    }

    const headers = ["Name", "Phone", "Primary Crop", "District", "NIN", "Bank", "Account Name", "Account Number", "Verified", "Registered Date", "Registered By"];
    const csvContent = [
      headers.join(","),
      ...farmers.map(farmer => [
        `"${farmer.full_name}"`,
        `"${farmer.phone_number}"`,
        `"${farmer.primary_crop}"`,
        `"${farmer.district}"`,
        `"${farmer.nin || ''}"`,
        `"${farmer.bank_name || ''}"`,
        `"${farmer.account_name || ''}"`,
        `"${farmer.account_number || ''}"`,
        farmer.verified ? "Yes" : "No",
        farmer.created_at ? new Date(farmer.created_at).toLocaleDateString() : "N/A",
        `"${getRegisteredByName(farmer.created_by)}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `barutem-farmers-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Farmer database exported successfully");
  };

  // Helper to get registered by name
  const getRegisteredByName = (createdBy: string | null): string => {
    if (!createdBy) return "Unknown";
    
    // Check if it's a sub-admin
    const subAdmins = loadSubAdmins();
    const subAdmin = subAdmins.find(sa => sa.id === createdBy);
    if (subAdmin) return subAdmin.name;
    
    // Otherwise it's likely the General Admin
    return "General Admin";
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading farmers...</p>
        </CardContent>
      </Card>
    );
  }

  // Connection Check UI
  if (!SUPABASE_ENABLED) {
     return (
       <Card className="w-full border-red-200 bg-red-50">
         <CardContent className="py-8 text-center">
           <h3 className="text-lg font-semibold text-red-800 mb-2">Database Connection Missing</h3>
           <p className="text-red-600 mb-4">The application is not connected to Supabase.</p>
           <div className="text-left text-xs font-mono bg-white p-2 rounded border border-red-100 mt-2">
             DEBUG INFO:<br/>
             SUPABASE_ENABLED: {String(SUPABASE_ENABLED)}<br/>
             Role: {role}<br/>
             District: {userDistrict}
           </div>
         </CardContent>
       </Card>
     );
  }

  return (
    <div className="w-full space-y-4">
      <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <CardTitle className="text-lg">Farmer Registry</CardTitle>
            <CardDescription>
              {role === "general_admin" 
                ? `${farmers.length} farmers across all districts` 
                : `${farmers.length} farmers in ${userDistrict || "your district"}`}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {role === "general_admin" && (
              <Button 
                variant="outline" 
                onClick={exportToCSV}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export Farmer Database (CSV)
              </Button>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Register Farmer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] md:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Register New Farmer</DialogTitle>
                  <DialogDescription>
                    Add a new farmer to the database. All * marked fields are required.
                  </DialogDescription>
                </DialogHeader>

                {registrationError && (
                  <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md mb-4">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div className="text-sm text-destructive font-medium break-all">
                        {registrationError}
                      </div>
                    </div>
                  </div>
                )}

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
                    <Label htmlFor="nin">NIN (Optional)</Label>
                    <Input
                      id="nin"
                      value={formData.nin}
                      onChange={(e) => setFormData({ ...formData, nin: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name (Optional)</Label>
                    <Input
                      id="bank_name"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_name">Account Name (Optional)</Label>
                    <Input
                      id="account_name"
                      value={formData.account_name}
                      onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_number">Account Number (Optional)</Label>
                    <Input
                      id="account_number"
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passport">Passport Photo (Optional)</Label>
                    <Input
                      id="passport"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Select
                      value={formData.district}
                      onValueChange={(value) => setFormData({ ...formData, district: value })}
                      disabled={role === "sub_admin"}
                      required
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
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Registering..." : "Register Farmer"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {farmers.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
             <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
               <UserPlus className="h-6 w-6 text-primary" />
             </div>
             <h3 className="text-lg font-medium text-slate-900">No Farmers Registered Yet</h3>
             <p className="text-slate-500 mb-6 max-w-sm mx-auto">
               Get started by registering your first farmer to the database.
             </p>
             <Button onClick={() => setDialogOpen(true)}>
               <UserPlus className="mr-2 h-4 w-4" />
               Register First Farmer
             </Button>
          </div>
        ) : isMobile ? (
          // Mobile Card Layout
          <div className="grid gap-4">
            {farmers.map((farmer) => (
              <FarmerCard
                key={farmer.id}
                farmer={farmer}
                registeredByName={getRegisteredByName(farmer.created_by)}
                isGeneralAdmin={role === "general_admin"}
                onToggleVerified={handleToggleVerified}
              />
            ))}
          </div>
        ) : (
          // Desktop Table Layout
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Primary Crop</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Registered By</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Registered</TableHead>
                  {role === "general_admin" && <TableHead>Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {farmers.map((farmer) => (
                  <TableRow key={farmer.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {farmer.full_name}
                        {farmer.verified && (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{farmer.phone_number}</TableCell>
                    <TableCell>{farmer.primary_crop}</TableCell>
                    <TableCell>{farmer.district}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {getRegisteredByName(farmer.created_by)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {farmer.verified ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      {farmer.created_at ? new Date(farmer.created_at).toLocaleDateString() : "N/A"}
                    </TableCell>
                    {role === "general_admin" && (
                      <TableCell>
                        <Button
                          variant={farmer.verified ? "outline" : "default"}
                          size="sm"
                          className="h-11"
                          onClick={() => handleToggleVerified(farmer.id, farmer.verified)}
                        >
                          {farmer.verified ? "Remove Verification" : "Verify Farmer"}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
