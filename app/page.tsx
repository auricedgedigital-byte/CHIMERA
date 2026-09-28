import { HeroCarousel, type HeroCarouselItem } from "@/components/ui/hero-carousel";

const COLLECTIONS: HeroCarouselItem[] = [
  {
    id: 1,
    title: "NEW\nWORLD\nORDER",
    image: "/products/hoodie-red-1.png",
    accent: "#5a1010",
    tagline: "SS-2025 — Distressed Heavyweight",
    credit: "BY CHIMERA BRAND.",
    slug: "/collections/new-world",
  },
  {
    id: 2,
    title: "THE\nCLASSICS",
    image: "/products/hoodie-classic.png",
    accent: "#1a1a2a",
    tagline: "Chimera Classic Series",
    credit: "BY CHIMERA BRAND.",
    slug: "/collections/classics",
  },
  {
    id: 3,
    title: "VISIONS\n& GRAFFITI",
    image: "/products/hoodie-red-2.png",
    accent: "#2a1a3a",
    tagline: "Art × Streetwear",
    credit: "BY CHIMERA BRAND.",
    slug: "/collections/visions",
  },
];

export default function HomePage() {
  return (
    <div style={{ height: "100svh", width: "100vw" }}>
      <HeroCarousel
        items={COLLECTIONS}
        defaultIndex={1}
        brand="CHIMERA"
        autoplay
        autoplayDelay={6000}
        className="h-full"
      />
    </div>
  );
}
