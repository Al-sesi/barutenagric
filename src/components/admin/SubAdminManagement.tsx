import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, doc, setDoc } from "firebase/firestore";
import { firestore } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const districts = ["Ilesha Baruba", "Gwanara", "Okuta", "Yashikira"];

interface SubAdmin {
  id: string;
  email: string;
  phone: string;
  nin: string;
  passport_url: string | null;
  district: string;
}

export default function SubAdminManagement() {
  const { role } = useAuth();
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",
    nin: "",
    district: "",
  });
  const [passportFile, setPassportFile] = useState<File | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(firestore, "sub_admins"));
        const rows: SubAdmin[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            email: data.email,
            phone: data.phone,
            nin: data.nin,
            passport_url: data.passport_url ?? null,
            district: data.district,
          };
        });
        setSubAdmins(rows);
      } catch {
        toast.error("Failed to load sub-admins");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = import.meta.env.VITE_ADMIN_CREATE_SA_URL as string | undefined;
      if (!url) {
        toast.error("Creation endpoint not configured");
        return;
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          nin: formData.nin,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error || "Failed to create Sub-Admin");
        return;
      }
      const uid = json.uid as string;

      const passportUrl = passportFile ? "placeholder" : null;
      await setDoc(doc(firestore, "roles", uid), { role: "sub_admin", district: formData.district });
      await setDoc(doc(firestore, "sub_admins", uid), {
        email: formData.email,
        phone: formData.phone,
        nin: formData.nin,
        passport_url: passportUrl,
        district: formData.district,
      });
      toast.success("Sub-Admin created and assigned");
      setDialogOpen(false);
      setFormData({ email: "", password: "", phone: "", nin: "", district: "" });
      setPassportFile(null);
    } catch (e) {
      toast.error("Failed to create Sub-Admin");
    }
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
            <CardDescription className="text-sm">Create and manage Sub-Admin accounts</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 w-full md:w-auto">Create Sub-Admin</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] md:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">New Sub-Admin</DialogTitle>
                <DialogDescription className="text-sm">Enter credentials and assign district</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-12" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="h-12" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-12" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nin">NIN</Label>
                  <Input id="nin" value={formData.nin} onChange={(e) => setFormData({ ...formData, nin: e.target.value })} className="h-12" required />
                </div>
                <div className="space-y-2">
                  <Label>District</Label>
                  <Select value={formData.district} onValueChange={(v) => setFormData({ ...formData, district: v })}>
                    <SelectTrigger className="w-full h-12">
                      <SelectValue />
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
                  <Input id="passport" type="file" onChange={(e) => setPassportFile(e.target.files?.[0] ?? null)} className="h-12" />
                </div>
                <Button type="submit" className="w-full h-12">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="inline-block min-w-full align-middle">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>NIN</TableHead>
                  <TableHead>District</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subAdmins.map((sa) => (
                  <TableRow key={sa.id}>
                    <TableCell>{sa.email}</TableCell>
                    <TableCell>{sa.phone}</TableCell>
                    <TableCell>{sa.nin}</TableCell>
                    <TableCell>{sa.district}</TableCell>
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
