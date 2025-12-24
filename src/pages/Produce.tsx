import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import maizeImage from "@/assets/maize.jpg";
import cashewImage from "@/assets/cashew.jpg";
import yamImage from "@/assets/yam-new.jpg";
import milletImage from "@/assets/millet.jpg";
import soybeansImage from "@/assets/soybeans.jpg";
import tomatoesImage from "@/assets/tomatoes.jpg";
import sheaButterImage from "@/assets/shea-butter.jpg";

const Produce = () => {
  const [filter, setFilter] = useState("all");

  const products = [
    { name: "Premium Yam Tubers", image: yamImage, quantity: "300+ MT", season: "Year-round", category: "tubers" },
    { name: "Fresh Maize", image: maizeImage, quantity: "250+ MT", season: "Year-round", category: "grains" },
    { name: "Soya Beans", image: soybeansImage, quantity: "180+ MT", season: "Year-round", category: "legumes" },
    { name: "Guinea Corn (Sorghum)", image: milletImage, quantity: "150+ MT", season: "Oct-Jan", category: "grains" },
    { name: "Local Rice", image: tomatoesImage, quantity: "120+ MT", season: "Year-round", category: "grains" },
    { name: "Shea Butter", image: sheaButterImage, quantity: "80+ MT", season: "Year-round", category: "oils" },
    { name: "Cashew Nuts", image: cashewImage, quantity: "200+ MT", season: "Feb-May", category: "nuts" },
  ];

  const filteredProducts = filter === "all" 
    ? products 
    : products.filter(p => p.category === filter);

  const categories = [
    { id: "all", label: "All Products" },
    { id: "tubers", label: "Tubers" },
    { id: "grains", label: "Grains" },
    { id: "legumes", label: "Legumes" },
    { id: "oils", label: "Oils & Butters" },
    { id: "nuts", label: "Nuts" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-12 sm:py-16">
        <div className="container text-center px-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Our Premium Produce</h1>
          <p className="text-base sm:text-lg lg:text-xl opacity-95 max-w-3xl mx-auto">
            Quality crops directly from the four districts of Barutem: 
            Ilesha Baruba, Gwanara, Okuta, and Yashikira
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-6 sm:py-8 bg-muted/30 border-b">
        <div className="container px-4">
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setFilter(category.id)}
                variant={filter === category.id ? "default" : "outline"}
                className={`text-xs sm:text-sm h-9 sm:h-10 ${filter === category.id 
                  ? "bg-accent text-accent-foreground hover:bg-accent/90" 
                  : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 sm:py-16">
        <div className="container px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={index}
                name={product.name}
                image={product.image}
                quantity={product.quantity}
                season={product.season}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">
                No products found in this category.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Produce;
