import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, Wheat, Package, Calendar, MapPin, UserPlus } from "lucide-react";

interface Inquiry {
  id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  crop: string;
  volume_mt: number;
  message: string | null;
  status: string;
  assigned_district: string | null;
  assigned_to: string | null;
  created_at: string;
}

interface OrderCardProps {
  inquiry: Inquiry;
  isSubAdmin: boolean;
  districts: string[];
  onAssignDistrict: (inquiryId: string, district: string) => void;
  onOpenAssignDialog: (inquiry: Inquiry) => void;
  onMarkFulfilled: (inquiryId: string) => void;
}

export default function OrderCard({
  inquiry,
  isSubAdmin,
  districts,
  onAssignDistrict,
  onOpenAssignDialog,
  onMarkFulfilled
}: OrderCardProps) {
  const getStatusBadge = () => {
    if (inquiry.status === "fulfilled") {
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">FULFILLED</Badge>;
    }
    if (inquiry.assigned_to) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
          To: {inquiry.assigned_to}
        </Badge>
      );
    }
    if (inquiry.status === "assigned") {
      return <Badge variant="secondary">ASSIGNED</Badge>;
    }
    return <Badge variant="default">NEW</Badge>;
  };

  return (
    <Card className="border border-border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-foreground">{inquiry.buyer_name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              {new Date(inquiry.created_at).toLocaleDateString()}
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{inquiry.buyer_phone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{inquiry.buyer_email}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wheat className="h-4 w-4" />
              <span>{inquiry.crop}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span className="font-medium">{inquiry.volume_mt} MT</span>
            </div>
          </div>
          {inquiry.assigned_district && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{inquiry.assigned_district}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {!isSubAdmin && inquiry.status === "new" && (
            <>
              <Select onValueChange={(value) => onAssignDistrict(inquiry.id, value)}>
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder="Assign District" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                className="w-full h-11"
                onClick={() => onOpenAssignDialog(inquiry)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign to Sub-Admin
              </Button>
            </>
          )}
          {!isSubAdmin && inquiry.status === "assigned" && !inquiry.assigned_to && (
            <Button 
              variant="outline" 
              className="w-full h-11"
              onClick={() => onOpenAssignDialog(inquiry)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign to Sub-Admin
            </Button>
          )}
          {(inquiry.status === "assigned" || (isSubAdmin && inquiry.assigned_to)) && inquiry.status !== "fulfilled" && (
            <Button
              onClick={() => onMarkFulfilled(inquiry.id)}
              className="w-full h-11"
            >
              Mark Fulfilled
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
