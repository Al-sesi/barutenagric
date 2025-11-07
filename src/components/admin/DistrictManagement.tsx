import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DistrictAssignment {
  id: string;
  district: string;
  sub_admin_user_id: string | null;
  sub_admin_email: string | null;
}

export default function DistrictManagement() {
  const [assignments, setAssignments] = useState<DistrictAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEmail, setEditingEmail] = useState<Record<string, string>>({});

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

  if (loading) {
    return <p>Loading district assignments...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>District Sub-Admin Management</CardTitle>
        <CardDescription>Assign sub-administrators to districts (General Admin only)</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>District</TableHead>
              <TableHead>Sub-Admin Email</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell className="font-medium">{assignment.district}</TableCell>
                <TableCell>
                  <Input
                    type="email"
                    placeholder="sub-admin@example.com"
                    defaultValue={assignment.sub_admin_email || ""}
                    onChange={(e) =>
                      setEditingEmail({ ...editingEmail, [assignment.id]: e.target.value })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleUpdateEmail(assignment.id, assignment.district)}
                    size="sm"
                  >
                    Update
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
