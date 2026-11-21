import Image from "next/image";
const photos: Record<string, { photo: string; alt: string }> = {
  "life-insurance": { photo: "1609220136736-443140cffec6", alt: "A parent enjoying time outdoors with children" },
  "permanent-life": { photo: "1511632765486-a01980e01a18", alt: "Family sharing time together in the sunshine" },
  "final-expense": { photo: "1511895426328-dc8714191300", alt: "Loved ones gathered together at sunset" },
  "mortgage-protection": { photo: "1564013799919-ab600027ffc6", alt: "A welcoming family home with a green lawn" },
  "iul": { photo: "1511632765486-a01980e01a18", alt: "Family looking ahead to their future together" },
  "infinite-banking": { photo: "1450101499163-c8848c66ca85", alt: "People reviewing documents and planning together" },
  "whole-life-debt": { photo: "1434626881859-194d67b2b86f", alt: "A notebook and calculator for household planning" },
  "disability": { photo: "1454165804606-c3d57bc86b40", alt: "People working together at a desk" },
  "critical-illness": { photo: "1609220136736-443140cffec6", alt: "A parent and children sharing a close family moment" },
  "retirement": { photo: "1476514525535-07fb3b4ae5f1", alt: "A peaceful lakeside landscape for the next chapter of life" },
};
export default function CoveragePhoto({ topic }: { topic: string }) {
  const photo = photos[topic];
  if (!photo) return null;
  return <div className="agency-coverage-photo"><Image src={`https://images.unsplash.com/photo-${photo.photo}?auto=format&fit=crop&w=900&q=80`} alt={photo.alt} width={900} height={560} unoptimized sizes="(max-width: 700px) 100vw, 33vw" /></div>;
}
