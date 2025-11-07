import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import maizeImage from "@/assets/maize.jpg";
import cashewImage from "@/assets/cashew.jpg";
import yamImage from "@/assets/yam.jpg";
import milletImage from "@/assets/millet.jpg";
import soybeansImage from "@/assets/soybeans.jpg";
import tomatoesImage from "@/assets/tomatoes.jpg";
import peppersImage from "@/assets/peppers.jpg";

const Produce = () => {
  const [filter, setFilter] = useState("all");

  const products = [
    { name: "Maize", image: maizeImage, quantity: "200+ MT", season: "Year-round", category: "grains" },
    { name: "Cashew Nuts", image: cashewImage, quantity: "150+ MT", season: "Feb-May", category: "nuts" },
    { name: "Yam Tubers", image: yamImage, quantity: "180+ MT", season: "Year-round", category: "tubers" },
    { name: "Millet", image: milletImage, quantity: "120+ MT", season: "Oct-Jan", category: "grains" },
    { name: "Soybeans", image: soybeansImage, quantity: "160+ MT", season: "Year-round", category: "legumes" },
    { name: "Tomatoes", image: tomatoesImage, quantity: "100+ MT", season: "Nov-Apr", category: "vegetables" },
    { name: "Peppers", image: peppersImage, quantity: "90+ MT", season: "Year-round", category: "vegetables" },
  ];

  const filteredProducts = filter === "all" 
    ? products 
    : products.filter(p => p.category === filter);

  const categories = [
    { id: "all", label: "All Products" },
    { id: "grains", label: "Grains" },
    { id: "nuts", label: "Nuts" },
    { id: "tubers", label: "Tubers" },
    { id: "legumes", label: "Legumes" },
    { id: "vegetables", label: "Vegetables" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container text-center">
          <h1 className="text-5xl font-bold mb-4">Our Premium Produce</h1>
          <p className="text-xl opacity-95 max-w-3xl mx-auto">
            Quality crops directly from the four districts of Baruten: 
            Ilesha Baruba, Gwanara, Okuta, and Yashikira
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 bg-muted/30 border-b">
        <div className="container">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setFilter(category.id)}
                variant={filter === category.id ? "default" : "outline"}
                className={filter === category.id 
                  ? "bg-accent text-accent-foreground hover:bg-accent/90" 
                  : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                }
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
