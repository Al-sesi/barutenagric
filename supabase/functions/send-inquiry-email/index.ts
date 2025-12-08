import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InquiryEmailRequest {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  product: string;
  quantity: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const inquiry: InquiryEmailRequest = await req.json();
    console.log("Processing inquiry email:", inquiry);

    const emailResponse = await resend.emails.send({
      from: "Barutem Agricultural Portal <onboarding@resend.dev>",
      to: ["barutenagriculture@gmail.com"],
      subject: `New Inquiry: ${inquiry.product} - ${inquiry.companyName}`,
      html: `
        <h2>New Product Inquiry</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
          <h3 style="color: #2d5016;">Company Information</h3>
          <p><strong>Company Name:</strong> ${inquiry.companyName}</p>
          <p><strong>Contact Person:</strong> ${inquiry.contactPerson}</p>
          <p><strong>Email:</strong> <a href="mailto:${inquiry.email}">${inquiry.email}</a></p>
          <p><strong>Phone:</strong> <a href="tel:${inquiry.phone}">${inquiry.phone}</a></p>
          
          <h3 style="color: #2d5016; margin-top: 20px;">Order Details</h3>
          <p><strong>Product:</strong> ${inquiry.product}</p>
          <p><strong>Quantity:</strong> ${inquiry.quantity}</p>
          
          <h3 style="color: #2d5016; margin-top: 20px;">Additional Details</h3>
          <p>${inquiry.message.replace(/\n/g, '<br>')}</p>
        </div>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          This inquiry was submitted through the Barutem Agricultural Portal contact form.
        </p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error in send-inquiry-email function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
