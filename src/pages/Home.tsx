import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, TrendingUp, Shield } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-agriculture.jpg";
import maizeImage from "@/assets/maize.jpg";
import cashewImage from "@/assets/cashew.jpg";
import yamImage from "@/assets/yam.jpg";

const Home = () => {
  const benefits = [
    {
      icon: <CheckCircle2 className="h-12 w-12 text-accent" />,
      title: "Guaranteed Quality",
      description: "Rigorous quality control across all four districts ensures premium produce every time."
    },
    {
      icon: <TrendingUp className="h-12 w-12 text-accent" />,
      title: "Localized Supply Coordination",
      description: "Direct sourcing from Ilesha Baruba, Gwanara, Okuta, and Yashikira for consistent supply."
    },
    {
      icon: <Shield className="h-12 w-12 text-accent" />,
      title: "Transparent Value Chain",
      description: "Digital tracking and fair value distribution throughout the entire supply chain."
    }
  ];

  const featuredProducts = [
    { name: "Premium Cashew Nuts", image: cashewImage, quantity: "150+ MT" },
    { name: "Fresh Maize", image: maizeImage, quantity: "200+ MT" },
    { name: "Quality Yam Tubers", image: yamImage, quantity: "180+ MT" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[500px] sm:h-[600px] lg:h-[700px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-primary/80"></div>
        </div>
        
        <div className="relative z-10 container text-center text-primary-foreground px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            Barutem: Your Direct Source for Premium West African Produce
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 max-w-3xl mx-auto opacity-95">
            Leveraging technology for transparent supply chains and guaranteed quality,
            delivering fresh crops directly from our community to your company.
          </p>
          <Link to="/produce">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 font-semibold h-auto">
              Explore Our Premium Crops
            </Button>
          </Link>
        </div>
      </section>

      {/* Why Choose Baruten Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-muted/30">
        <div className="container px-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-3 sm:mb-4 text-foreground">
            Why Choose Barutem?
          </h2>
          <p className="text-center text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">
            Our commitment to excellence spans every aspect of agricultural supply
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 pb-8">
                  <div className="flex justify-center mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container px-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-3 sm:mb-4 text-foreground">
            Featured Products
          </h2>
          <p className="text-center text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">
            Discover our most sought-after premium crops
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((product, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-foreground">
                    {product.name}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Available: <span className="font-semibold text-accent">{product.quantity}</span>
                  </p>
                  <Link to="/contact">
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      Request Quote
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/produce">
              <Button variant="outline" size="lg" className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                View All Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
