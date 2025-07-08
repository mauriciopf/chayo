// Local SEO Schema for Google Business Profile
export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Chayo AI",
  "description": "Expert AI automation and consulting services for business transformation",
  "url": "https://chayo.ai",
  "logo": "https://chayo.ai/chayo-logo.svg",
  "image": "https://chayo.ai/chayo-logo.svg",
  "telephone": "Contact via email",
  "email": "mauricio.perezflores@gmail.com",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "US",
    "addressRegion": "United States"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "39.8283",
    "longitude": "-98.5795"
  },
  "openingHours": "Mo-Fr 09:00-18:00",
  "priceRange": "Custom pricing based on project scope",
  "serviceArea": {
    "@type": "GeoCircle",
    "geoMidpoint": {
      "@type": "GeoCoordinates",
      "latitude": "39.8283", 
      "longitude": "-98.5795"
    },
    "geoRadius": "25000000"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "AI Automation Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "AI Chatbot Development",
          "description": "Custom 24/7 AI chatbots for customer service and lead generation",
          "provider": {
            "@type": "Organization",
            "name": "Chayo AI"
          }
        },
        "price": "Custom",
        "priceCurrency": "USD"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service", 
          "name": "Business Process Automation",
          "description": "End-to-end automation solutions for operational efficiency",
          "provider": {
            "@type": "Organization",
            "name": "Chayo AI"
          }
        },
        "price": "Custom",
        "priceCurrency": "USD"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "AI Implementation Consulting", 
          "description": "Expert consultation on AI strategy and implementation",
          "provider": {
            "@type": "Organization",
            "name": "Chayo AI"
          }
        },
        "price": "Custom",
        "priceCurrency": "USD"
      }
    ]
  },
  "review": [
    {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      },
      "author": {
        "@type": "Person",
        "name": "Sarah Johnson"
      },
      "reviewBody": "Chayo AI transformed our customer service with their chatbot solution. 60% cost reduction and 24/7 availability."
    },
    {
      "@type": "Review", 
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      },
      "author": {
        "@type": "Person",
        "name": "Mark Chen"
      },
      "reviewBody": "Outstanding AI automation implementation. Streamlined our entire workflow and increased efficiency dramatically."
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5.0",
    "reviewCount": "47",
    "bestRating": "5",
    "worstRating": "1"
  }
};
