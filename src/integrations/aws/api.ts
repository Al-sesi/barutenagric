export interface InquiryRequest {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  product: string;
  quantity: string;
  message: string;
}

export async function submitInquiry(payload: InquiryRequest): Promise<Response> {
  const url = import.meta.env.VITE_AWS_INQUIRY_URL as string | undefined;
  if (!url) {
    throw new Error("AWS inquiry URL is not configured");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return res;
}