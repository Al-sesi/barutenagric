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
    return (
      <Card className="border-secondary/30">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading district assignments...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-secondary/30">
      <CardHeader className="bg-secondary/10">
        <CardTitle className="text-lg md:text-xl text-primary">District Management Console</CardTitle>
        <CardDescription className="text-sm">
          Configure Sub-Admin assignments for each district (General Admin only)
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
  );
}
