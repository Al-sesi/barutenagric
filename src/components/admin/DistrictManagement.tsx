import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

interface DistrictAssignment {
  id: string;
  district: string;
  sub_admin_user_id: string | null;
  sub_admin_email: string | null;
}

const DISTRICTS = [
  "Baruten Central",
  "Gwanara",
  "Kaiama",
  "Kakabu",
  "Okuta",
  "Sinawu",
  "Gwanabe",
  "Ilesha",
  "Yashikira"
];

export default function DistrictManagement() {
  const [assignments, setAssignments] = useState<DistrictAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEmail, setEditingEmail] = useState<Record<string, string>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingSubAdmin, setCreatingSubAdmin] = useState(false);
  const [newSubAdmin, setNewSubAdmin] = useState({
    email: "",
    password: "",
    district: "",
    phone_number: "",
    nin: ""
  });
  const [passportFile, setPassportFile] = useState<File | null>(null);

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from("district_assignments")
      .select("*")
      .order("district");

    if (error) {
      toast.error("Failed to load district assignments");
      return;
    }

    setAssignments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleUpdateEmail = async (districtId: string, district: string) => {
    const email = editingEmail[districtId];
    if (!email) return;

    const { error } = await supabase
      .from("district_assignments")
      .update({ sub_admin_email: email })
      .eq("id", districtId);

    if (error) {
      toast.error("Failed to update assignment");
      return;
    }

    toast.success(`Sub-Admin email updated for ${district}`);
    fetchAssignments();
  };

  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingSubAdmin(true);

    let passportUrl = null;

    // Upload passport if provided
    if (passportFile) {
      const fileExt = passportFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('passports')
        .upload(filePath, passportFile);

      if (uploadError) {
        toast.error("Failed to upload passport");
        setCreatingSubAdmin(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('passports')
        .getPublicUrl(filePath);
      
      passportUrl = publicUrl;
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newSubAdmin.email,
      password: newSubAdmin.password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin-dashboard`
      }
    });

    if (authError) {
      toast.error(authError.message);
      setCreatingSubAdmin(false);
      return;
    }

    if (!authData.user) {
      toast.error("Failed to create user");
      setCreatingSubAdmin(false);
      return;
    }

    // Assign sub_admin role with additional fields
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: authData.user.id,
        role: "sub_admin",
        district: newSubAdmin.district,
        phone_number: newSubAdmin.phone_number,
        nin: newSubAdmin.nin,
        passport_url: passportUrl
      });

    if (roleError) {
      toast.error("Failed to assign role");
      console.error(roleError);
      setCreatingSubAdmin(false);
      return;
    }

    // Update district assignment
    const { error: assignmentError } = await supabase
      .from("district_assignments")
      .update({
        sub_admin_user_id: authData.user.id,
        sub_admin_email: newSubAdmin.email
      })
      .eq("district", newSubAdmin.district);

    if (assignmentError) {
      console.error("Failed to update district assignment:", assignmentError);
    }

    toast.success("Sub-admin created successfully!");
    setNewSubAdmin({ email: "", password: "", district: "", phone_number: "", nin: "" });
    setPassportFile(null);
    setShowCreateForm(false);
    setCreatingSubAdmin(false);
    fetchAssignments();
  };

  if (loading) {
    return (
      <Card className="border-secondary/30">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading district assignments...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-secondary/30">
        <CardHeader className="bg-secondary/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg md:text-xl text-primary">Create Sub-Admin Account</CardTitle>
              <CardDescription className="text-sm">
                Create new sub-administrator accounts for districts
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              variant={showCreateForm ? "outline" : "default"}
              className="w-full md:w-auto"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {showCreateForm ? "Cancel" : "Create Sub-Admin"}
            </Button>
          </div>
        </CardHeader>
        {showCreateForm && (
          <CardContent className="pt-6">
            <form onSubmit={handleCreateSubAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sub-email">Email</Label>
                <Input
                  id="sub-email"
                  type="email"
                  value={newSubAdmin.email}
                  onChange={(e) => setNewSubAdmin({ ...newSubAdmin, email: e.target.value })}
                  placeholder="subadmin@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub-password">Password</Label>
                <Input
                  id="sub-password"
                  type="password"
                  value={newSubAdmin.password}
                  onChange={(e) => setNewSubAdmin({ ...newSubAdmin, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub-phone">Phone Number</Label>
                <Input
                  id="sub-phone"
                  type="tel"
                  value={newSubAdmin.phone_number}
                  onChange={(e) => setNewSubAdmin({ ...newSubAdmin, phone_number: e.target.value })}
                  placeholder="+234..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub-nin">NIN (National Identification Number)</Label>
                <Input
                  id="sub-nin"
                  type="text"
                  value={newSubAdmin.nin}
                  onChange={(e) => setNewSubAdmin({ ...newSubAdmin, nin: e.target.value })}
                  placeholder="NIN Number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub-passport">Passport (Required for Sub-Admins)</Label>
                <Input
                  id="sub-passport"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
                  required
                  className="cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub-district">District</Label>
                <Select
                  value={newSubAdmin.district}
                  onValueChange={(value) => setNewSubAdmin({ ...newSubAdmin, district: value })}
                  required
                >
                  <SelectTrigger id="sub-district">
                    <SelectValue placeholder="Select a district" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISTRICTS.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={creatingSubAdmin}>
                {creatingSubAdmin ? "Creating..." : "Create Sub-Admin Account"}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      <Card className="border-secondary/30">
        <CardHeader className="bg-secondary/10">
          <CardTitle className="text-lg md:text-xl text-primary">District Assignments</CardTitle>
          <CardDescription className="text-sm">
            View and update sub-administrator assignments for each district
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">District</TableHead>
                    <TableHead className="whitespace-nowrap">Sub-Admin Email</TableHead>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium whitespace-nowrap">{assignment.district}</TableCell>
                      <TableCell>
                        <Input
                          type="email"
                          placeholder="sub-admin@example.com"
                          defaultValue={assignment.sub_admin_email || ""}
                          onChange={(e) =>
                            setEditingEmail({ ...editingEmail, [assignment.id]: e.target.value })
                          }
                          className="h-10 min-w-[200px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleUpdateEmail(assignment.id, assignment.district)}
                          size="sm"
                          className="h-10 w-full md:w-auto"
                        >
                          Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
