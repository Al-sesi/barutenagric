import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

const districts = ["Ilesha Baruba", "Gwanara", "Okuta", "Yashikira"];

const STORAGE_KEY = "baruten_sub_admins";

export interface SubAdmin {
  id: string;
  email: string;
  phone: string;
  nin: string;
  passport_url: string | null;
  district: string;
  name: string;
}

// Helper to load sub-admins from localStorage
export const loadSubAdmins = (): SubAdmin[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to save sub-admins to localStorage
const saveSubAdmins = (subAdmins: SubAdmin[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subAdmins));
};

export default function SubAdminManagement() {
  const { role } = useAuth();
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",
    nin: "",
    district: "",
    name: "",
  });
  const [passportFile, setPassportFile] = useState<File | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadSubAdmins();
    setSubAdmins(loaded);
  }, []);

  const handleCreateSubAdmin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.district) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newSubAdmin: SubAdmin = {
      id: crypto.randomUUID(),
      email: formData.email,
      phone: formData.phone,
      nin: formData.nin,
      passport_url: passportFile ? URL.createObjectURL(passportFile) : null,
      district: formData.district,
      name: formData.name,
    };

    const updated = [...subAdmins, newSubAdmin];
    setSubAdmins(updated);
    saveSubAdmins(updated);

    toast.success(`Sub-Admin "${formData.name}" created successfully`);
    setDialogOpen(false);
    setFormData({ email: "", password: "", phone: "", nin: "", district: "", name: "" });
    setPassportFile(null);
  };

  const handleDeleteSubAdmin = (id: string) => {
    const updated = subAdmins.filter(sa => sa.id !== id);
    setSubAdmins(updated);
    saveSubAdmins(updated);
    toast.success("Sub-Admin removed");
  };

  if (role !== "general_admin") {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="bg-primary/5">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <CardTitle className="text-lg md:text-xl text-primary">Sub-Admin Management</CardTitle>
            <CardDescription className="text-sm">Create and manage Sub-Admin accounts (stored locally)</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 w-full md:w-auto">Create Sub-Admin</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] md:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">New Sub-Admin</DialogTitle>
                <DialogDescription className="text-sm">Enter details and assign district</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubAdmin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    className="h-12" 
                    placeholder="e.g., Logistics Head"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    className="h-12" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                    className="h-12" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nin">NIN</Label>
                  <Input 
                    id="nin" 
                    value={formData.nin} 
                    onChange={(e) => setFormData({ ...formData, nin: e.target.value })} 
                    className="h-12" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>District *</Label>
                  <Select value={formData.district} onValueChange={(v) => setFormData({ ...formData, district: v })}>
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passport">Passport Photo</Label>
                  <Input 
                    id="passport" 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setPassportFile(e.target.files?.[0] ?? null)} 
                    className="h-12" 
                  />
                </div>
                <Button type="submit" className="w-full h-12">Create Sub-Admin</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {subAdmins.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No sub-admins created yet. Click "Create Sub-Admin" to add one.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>NIN</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subAdmins.map((sa) => (
                    <TableRow key={sa.id}>
                      <TableCell className="font-medium">{sa.name}</TableCell>
                      <TableCell>{sa.email}</TableCell>
                      <TableCell>{sa.phone || "—"}</TableCell>
                      <TableCell>{sa.nin || "—"}</TableCell>
                      <TableCell>{sa.district}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteSubAdmin(sa.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
