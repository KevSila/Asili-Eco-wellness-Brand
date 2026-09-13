const WHATSAPP_NUMBER = "254717578394";

export const publicHoneyFunnel = {
  orderOnline: "/honey/#order",
  explore: "/honey/",
  whatsappEnquiry: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello Asili, I would like to ask about your Makueni honey, available sizes and delivery options.")}`,
} as const;
