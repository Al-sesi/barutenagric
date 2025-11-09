import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, GitBranch, CheckCircle, Truck } from "lucide-react";

const Process = () => {
  const steps = [
    {
      icon: <Globe className="h-16 w-16 text-accent" />,
      title: "Digital Sourcing",
      description: "Buyer submits order request via our secure online portal with detailed specifications and quantity requirements."
    },
    {
      icon: <GitBranch className="h-16 w-16 text-accent" />,
      title: "Centralized Coordination",
      description: "Portal admin team efficiently allocates orders across Baruten's four supply districts based on availability and crop quality."
    },
    {
      icon: <CheckCircle className="h-16 w-16 text-accent" />,
      title: "Quality Aggregation",
      description: "Local Sub-Admins in Ilesha Baruba, Gwanara, Okuta, and Yashikira gather crops with rigorous quality control standards."
    },
    {
      icon: <Truck className="h-16 w-16 text-accent" />,
      title: "Direct Fulfillment",
      description: "Orders are shipped with full traceability, and funds are rapidly transferred, maximizing value for the farming community."
    }
  ];

  const districts = [
    { name: "Ilesha Baruba", position: "top-1/4 left-1/4" },
    { name: "Gwanara", position: "top-1/4 right-1/4" },
    { name: "Okuta", position: "bottom-1/4 left-1/3" },
    { name: "Yashikira", position: "bottom-1/4 right-1/3" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-12 sm:py-16">
        <div className="container text-center px-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">A Transparent Supply Chain, Built on Trust</h1>
          <p className="text-base sm:text-lg lg:text-xl opacity-95 max-w-3xl mx-auto">
            Our streamlined process ensures efficiency, quality, and fair compensation
            for every stakeholder in the agricultural value chain
          </p>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-accent/30 -ml-4"></div>
                )}
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="pt-8 pb-8 text-center">
                    <div className="flex justify-center mb-4">
                      {step.icon}
                    </div>
                    <div className="text-accent font-bold text-lg mb-2">
                      Step {index + 1}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Districts Map Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <h2 className="text-4xl font-bold text-center mb-4 text-foreground">
            Our Supply Districts
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Four strategic hubs across Baruten ensure comprehensive coverage and consistent supply
          </p>
          
          <div className="max-w-4xl mx-auto bg-card rounded-lg p-12 relative" style={{ minHeight: "400px" }}>
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <path d="M100,20 L180,60 L180,140 L100,180 L20,140 L20,60 Z" 
                      fill="currentColor" 
                      className="text-primary" />
              </svg>
            </div>
            
            {districts.map((district, index) => (
              <div 
                key={index}
                className={`absolute ${district.position} transform -translate-x-1/2 -translate-y-1/2`}
              >
                <div className="bg-accent text-accent-foreground px-6 py-3 rounded-full font-bold shadow-lg">
                  {district.name}
                </div>
              </div>
            ))}
            
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold text-lg shadow-xl">
                Baruten Hub
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-4xl font-bold text-center mb-12 text-foreground">
            The Baruten Advantage
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  Efficiency
                </h3>
                <p className="text-muted-foreground">
                  Streamlined digital processes reduce transaction time and costs significantly.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  Traceability
                </h3>
                <p className="text-muted-foreground">
                  Complete visibility from farm to delivery ensures quality and accountability.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  Fair Value
                </h3>
                <p className="text-muted-foreground">
                  Direct relationships maximize returns for farmers while maintaining competitive pricing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Process;
