import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/site-config";

export function WhatsAppFloat() {
  return (
    <a
      href={whatsappLink(
        "Hello SR Motors, I'd like to speak with someone about a vehicle.",
      )}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with SR Motors on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:scale-105"
    >
      <MessageCircle className="size-7" fill="white" />
    </a>
  );
}
