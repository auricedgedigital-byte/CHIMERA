"use client";
import { LuminaInteractiveList, type LuminaSlide } from "@/components/ui/lumina-interactive-list";

// Glass effect — clean, refractive, timeless
const SLIDES: LuminaSlide[] = [
  {
    title: "Chimera\nClassic",
    description: "The original. Bubble graffiti wordmark on charcoal acid wash. This is where it started.",
    price: 85.00,
    media: "/products/hoodie-classic.png",
    checkoutUrl: "#", // Replace with your Shopify product URL
  },
  {
    title: "Samurai\nOversized",
    description: "Dusty blue oversized silhouette. A samurai in a field of flowers — distressed and alive.",
    price: 95.00,
    media: "/products/hoodie-blue.png",
    checkoutUrl: "#",
  },
];

export default function ClassicsPage() {
  return (
    <div style={{ height: "100svh", width: "100vw", position: "relative" }}>
      <a href="/" className="chimera-back">← CHIMERA</a>
      <LuminaInteractiveList
        slides={SLIDES}
        effect="glass"
        collectionName="The Classics"
      />
    </div>
  );
}
