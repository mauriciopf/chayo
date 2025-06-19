export const additionalSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Agentic AI",
  "description": "Expert AI automation and consulting services for business transformation",
  "url": "https://agentic.ai",
  "telephone": "Contact via email",
  "email": "mauricio.perezflores@gmail.com",
  "areaServed": "Worldwide",
  "priceRange": "Custom pricing",
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
    "name": "AI Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "AI Automation Consulting",
          "description": "Expert consultation on AI implementation and business process automation"
        }
      },
      {
        "@type": "Offer", 
        "itemOffered": {
          "@type": "Service",
          "name": "Custom AI Chatbot Development",
          "description": "24/7 intelligent chatbots for customer service and lead generation"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service", 
          "name": "Business Process Automation",
          "description": "End-to-end automation solutions for operational efficiency"
        }
      }
    ]
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5",
    "reviewCount": "50",
    "bestRating": "5",
    "worstRating": "1"
  }
};
