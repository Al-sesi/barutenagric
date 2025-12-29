import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Mail, Phone, MapPin, CreditCard, User } from "lucide-react";
import { SubAdmin } from "./SubAdminManagement";

interface SubAdminCardProps {
  subAdmin: SubAdmin;
  onDelete: (id: string) => void;
}

export default function SubAdminCard({ subAdmin, onDelete }: SubAdminCardProps) {
  return (
    <Card className="border border-border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{subAdmin.name}</p>
              <p className="text-xs text-muted-foreground">{subAdmin.district}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(subAdmin.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{subAdmin.email}</span>
          </div>
          {subAdmin.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span>{subAdmin.phone}</span>
            </div>
          )}
          {subAdmin.nin && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-4 w-4 flex-shrink-0" />
              <span>NIN: {subAdmin.nin}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{subAdmin.district}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
