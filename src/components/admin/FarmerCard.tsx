import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Phone, MapPin, Wheat, User } from "lucide-react";

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

interface FarmerCardProps {
  farmer: Farmer;
  registeredByName: string;
  isGeneralAdmin: boolean;
  onToggleVerified: (farmerId: string, currentStatus: boolean) => void;
}

export default function FarmerCard({ farmer, registeredByName, isGeneralAdmin, onToggleVerified }: FarmerCardProps) {
  return (
    <Card className="border border-border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{farmer.full_name}</p>
              <p className="text-xs text-muted-foreground">by {registeredByName}</p>
            </div>
          </div>
          {farmer.verified ? (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground text-xs">
              <XCircle className="h-3 w-3 mr-1" />
              Unverified
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{farmer.phone_number}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wheat className="h-4 w-4" />
            <span>{farmer.primary_crop}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground col-span-2">
            <MapPin className="h-4 w-4" />
            <span>{farmer.district}</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Registered: {farmer.created_at ? new Date(farmer.created_at).toLocaleDateString() : "N/A"}
        </div>

        {isGeneralAdmin && (
          <Button
            variant={farmer.verified ? "outline" : "default"}
            size="sm"
            className="w-full h-11"
            onClick={() => onToggleVerified(farmer.id, farmer.verified)}
          >
            {farmer.verified ? "Remove Verification" : "Verify Farmer"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
