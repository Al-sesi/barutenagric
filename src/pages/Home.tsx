import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, TrendingUp, Shield } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-agriculture.jpg";
import maizeImage from "@/assets/maize.jpg";
import cashewImage from "@/assets/cashew.jpg";
import yamImage from "@/assets/yam-new.jpg";
import soybeansImage from "@/assets/soybeans.jpg";
import milletImage from "@/assets/millet.jpg";
import riceImage from "@/assets/rice.jpg";
import sheaButterImage from "@/assets/shea-butter.jpg";

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

  const yamImageUrl = yamImage;

  const produceItems = [
    { 
      name: "Premium Yam Tubers", 
      image: yamImageUrl, 
      quantity: "300+ MT",
      description: "The primary crop of Baruten. Our yam tubers are renowned for their size, texture, and excellent storage quality."
    },
    { 
      name: "Fresh Maize", 
      image: maizeImage, 
      quantity: "250+ MT",
      description: "High-quality maize grown in fertile Baruten soil, ideal for food processing and animal feed production."
    },
    { 
      name: "Soya Beans", 
      image: soybeansImage, 
      quantity: "180+ MT",
      description: "Protein-rich soya beans cultivated using sustainable farming practices, perfect for oil extraction and food products."
    },
    { 
      name: "Guinea Corn (Sorghum)", 
      image: milletImage, 
      quantity: "150+ MT",
      description: "Drought-resistant guinea corn with excellent nutritional value, widely used for beverages and traditional foods."
    },
    { 
      name: "Local Rice", 
      image: riceImage, 
      quantity: "120+ MT",
      description: "Locally cultivated rice varieties known for their unique aroma and taste, supporting food security initiatives."
    },
    { 
      name: "Shea Butter", 
      image: sheaButterImage, 
      quantity: "80+ MT",
      description: "Pure, unrefined shea butter extracted from handpicked shea nuts, prized for cosmetics and culinary applications."
    },
    { 
      name: "Cashew Nuts", 
      image: cashewImage, 
      quantity: "200+ MT",
      description: "Premium-grade cashew nuts harvested at peak ripeness, processed to international export standards."
    }
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

      {/* Our Produce Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container px-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-3 sm:mb-4 text-foreground">
            Our Produce from Baruten, Kwara State
          </h2>
          <p className="text-center text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">
            Premium agricultural products sourced directly from our farming communities
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {produceItems.map((product, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-5">
                  <h3 className="text-lg font-bold mb-2 text-foreground">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                    {product.description}
                  </p>
                  <p className="text-muted-foreground text-sm mb-4">
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