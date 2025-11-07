import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface ProductCardProps {
  name: string;
  image: string;
  quantity: string;
  season: string;
}

const ProductCard = ({ name, image, quantity, season }: ProductCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square overflow-hidden">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg text-foreground mb-2">{name}</h3>
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Available:</span> {quantity}
          </p>
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Season:</span> {season}
          </p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link to="/contact" className="w-full">
          <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            Request Quote
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
