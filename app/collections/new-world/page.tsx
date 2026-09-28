"use client";
import Link from "next/link";
import { LuminaInteractiveList, type LuminaSlide } from "@/components/ui/lumina-interactive-list";

// Crimson/plasma effect — raw, disruptive energy
const SLIDES: LuminaSlide[] = [
  {
    title: "New World\nVintage Wash",
    description: "Heavyweight distressed hoodie. Burgundy acid wash, typewriter typeface. 400GSM premium fleece.",
    price: 90.00,
    media: "/products/hoodie-red-1.png",
    checkoutUrl: "#", // Replace with your Shopify product URL
  },
  {
    title: "New World\nBlack Edition",
    description: "Same DNA. Darker soul. The black colorway for those who move in shadows.",
    price: 95.00,
    media: "/products/hoodie-red-2.png",
    checkoutUrl: "#",
  },
];

export default function NewWorldPage() {
  return (
    <div style={{ height: "100svh", width: "100vw", position: "relative" }}>
      <Link href="/" className="chimera-back">← CHIMERA</Link>
      <LuminaInteractiveList
        slides={SLIDES}
        effect="plasma"
        collectionName="New World Order"
      />
    </div>
  );
}
