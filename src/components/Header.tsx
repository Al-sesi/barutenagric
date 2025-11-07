import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sprout } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <Sprout className="h-6 w-6 text-accent" />
          <span>Baruten Agricultural Portal</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
            Home
          </Link>
          <Link to="/produce" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
            Produce
          </Link>
          <Link to="/process" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
            Process
          </Link>
          <Link to="/contact" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
            Contact
          </Link>
        </nav>

        <Link to="/contact">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
            Request Quote
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default Header;
