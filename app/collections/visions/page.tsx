"use client";
import Link from "next/link";
import { LuminaInteractiveList, type LuminaSlide } from "@/components/ui/lumina-interactive-list";

// Timeshift effect — surreal, glitchy, artistic
const SLIDES: LuminaSlide[] = [
  {
    title: "Show Me\nYour Face",
    description: "Greek statues meet street culture. Checkered panels, floral accents, distressed washes. Art is violence.",
    price: 95.00,
    media: "/products/hoodie-red-2.png",
    checkoutUrl: "#", // Replace with your Shopify product URL
  },
];

export default function VisionsPage() {
  return (
    <div style={{ height: "100svh", width: "100vw", position: "relative" }}>
      <Link href="/" className="chimera-back">← CHIMERA</Link>
      <LuminaInteractiveList
        slides={SLIDES}
        effect="timeshift"
        collectionName="Visions & Graffiti"
      />
    </div>
  );
}
