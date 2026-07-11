import { SITE } from "@/lib/constants";

export default function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "AI-powered job intelligence platform. Discover hidden jobs from Reddit, Discord and 50+ private sources.",
    url: SITE.url,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free Starter plan available",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "2400",
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      email: SITE.email,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
