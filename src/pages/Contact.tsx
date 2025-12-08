import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase, SUPABASE_ENABLED } from "@/integrations/supabase/client";
import { submitInquiry } from "@/integrations/aws/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Mail, Phone, MapPin, Building } from "lucide-react";

const formSchema = z.object({
  companyName: z.string().trim().min(2, "Company name must be at least 2 characters").max(100, "Company name must be less than 100 characters"),
  contactPerson: z.string().trim().min(2, "Contact name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(20, "Phone number must be less than 20 digits"),
  product: z.string().trim().min(2, "Product interest required").max(100, "Product must be less than 100 characters"),
  quantity: z.string().trim().min(1, "Quantity required").max(50, "Quantity must be less than 50 characters"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(1000, "Message must be less than 1000 characters"),
});

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      product: "",
      quantity: "",
      message: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Extract numeric value from quantity string (e.g., "50 MT" -> 50)
      const volumeMatch = values.quantity.match(/(\d+)/);
      const volumeMt = volumeMatch ? parseInt(volumeMatch[1]) : 0;

      const awsUrl = import.meta.env.VITE_AWS_INQUIRY_URL as string | undefined;

      if (awsUrl) {
        const response = await submitInquiry({
          companyName: values.companyName,
          contactPerson: values.contactPerson,
          email: values.email,
          phone: values.phone,
          product: values.product,
          quantity: values.quantity,
          message: values.message,
        });

        if (!response.ok) {
          throw new Error("AWS inquiry submission failed");
        }
      } else if (SUPABASE_ENABLED) {
        const { error } = await supabase.from("inquiries").insert({
          buyer_name: values.companyName,
          buyer_email: values.email,
          buyer_phone: values.phone,
          crop: values.product,
          volume_mt: volumeMt,
          message: `Contact: ${values.contactPerson}\n\nQuantity: ${values.quantity}\n\n${values.message}`,
        });

        if (error) throw error;

        try {
          await supabase.functions.invoke("send-inquiry-email", {
            body: {
              companyName: values.companyName,
              contactPerson: values.contactPerson,
              email: values.email,
              phone: values.phone,
              product: values.product,
              quantity: values.quantity,
              message: values.message,
            },
          });
        } catch (emailError) {
          console.error("Email notification failed:", emailError);
        }
      } else {
        throw new Error("No backend configured (AWS or Supabase)");
      }

      setIsSubmitted(true);
      toast({
        title: "Inquiry Submitted Successfully",
        description: "Our General Admin will contact you within 24 hours to finalize your order.",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit inquiry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const contactInfo = [
    {
      icon: <Mail className="h-6 w-6 text-accent" />,
      label: "Email",
      value: "barutenagriculture@gmail.com",
      href: "mailto:barutenagriculture@gmail.com"
    },
    {
      icon: <Phone className="h-6 w-6 text-accent" />,
      label: "Phone",
      value: "07049216077",
      href: "tel:07049216077"
    },
    {
      icon: <MapPin className="h-6 w-6 text-accent" />,
      label: "Head Office",
      value: "Kosubosu, Baruten, Kwara State",
      href: null
    },
    {
      icon: <Building className="h-6 w-6 text-accent" />,
      label: "Supply Districts",
      value: "Ilesha Baruba, Gwanara, Okuta, Yashikira",
      href: null
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-12 sm:py-16">
        <div className="container text-center px-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Connect with Our Procurement Team</h1>
          <p className="text-base sm:text-lg lg:text-xl opacity-95 max-w-3xl mx-auto">
            Ready to place a bulk order? Our team is standing by to discuss your requirements
            and provide competitive pricing for premium West African produce.
          </p>
        </div>
      </section>

      {/* Contact Information Cards */}
      <section className="py-8 sm:py-12 bg-muted/30">
        <div className="container px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {contactInfo.map((info, index) => (
              <Card key={index}>
                <CardContent className="pt-6 pb-6 text-center">
                  <div className="flex justify-center mb-3">
                    {info.icon}
                  </div>
                  <h3 className="font-bold text-sm text-muted-foreground mb-2">
                    {info.label}
                  </h3>
                  {info.href ? (
                    <a 
                      href={info.href}
                      className="text-foreground hover:text-accent transition-colors font-medium"
                    >
                      {info.value}
                    </a>
                  ) : (
                    <p className="text-foreground font-medium">
                      {info.value}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12 sm:py-16">
        <div className="container max-w-3xl px-4">
          <Card>
            <CardContent className="pt-8 pb-8">
              <h2 className="text-3xl font-bold mb-6 text-foreground text-center">
                Request a Quote
              </h2>
              
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="bg-accent/10 text-accent rounded-lg p-8 mb-6">
                    <h3 className="text-2xl font-bold mb-2">Inquiry Submitted Successfully!</h3>
                    <p className="text-lg">
                      Our General Admin will contact you within 24 hours to finalize your order.
                    </p>
                  </div>
                  <Button 
                    onClick={() => setIsSubmitted(false)}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    Submit Another Inquiry
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Your company name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contactPerson"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Person *</FormLabel>
                            <FormControl>
                              <Input placeholder="Your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="your@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="+234..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="product"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product of Interest *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Maize, Cashew Nuts" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Required Quantity *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 50 MT" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Details *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Please provide any additional information about your order requirements, delivery preferences, or questions..."
                              className="min-h-32"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-6"
                    >
                      Submit Inquiry
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
