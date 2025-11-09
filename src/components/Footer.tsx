import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-8 sm:py-12 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Baruten Agricultural Portal</h3>
            <p className="text-sm opacity-90">
              Your direct source for premium West African produce.
              Leveraging technology for transparent supply chains.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-accent" />
                <a href="mailto:barutenagriculture@gmail.com" className="opacity-90 hover:text-accent transition-colors">
                  barutenagriculture@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-accent" />
                <a href="tel:07049216077" className="opacity-90 hover:text-accent transition-colors">
                  07049216077
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-accent" />
                <span className="opacity-90">Kosubosu, Baruten, Kwara State</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Supply Districts</h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li>Ilesha Baruba</li>
              <li>Gwanara</li>
              <li>Okuta</li>
              <li>Yashikira</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm opacity-75">
          <p>&copy; {new Date().getFullYear()} Baruten Agricultural Portal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
