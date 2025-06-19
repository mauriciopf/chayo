// Google Analytics 4 and Performance Monitoring Setup
export const analyticsConfig = {
  // Google Analytics 4 Configuration
  GA4_MEASUREMENT_ID: 'G-XXXXXXXXXX', // Replace with your GA4 ID
  
  // Core Web Vitals Tracking
  trackCoreWebVitals: true,
  
  // Custom Events for AI Business
  customEvents: {
    CONTACT_FORM_SUBMIT: 'contact_form_submit',
    DEMO_REQUEST: 'demo_request', 
    SERVICE_INQUIRY: 'service_inquiry',
    BLOG_READ: 'blog_article_read',
    NEWSLETTER_SIGNUP: 'newsletter_signup',
    PDF_DOWNLOAD: 'resource_download'
  },
  
  // Conversion Goals
  conversionGoals: [
    'contact_form_completion',
    'demo_booking',
    'consultation_request',
    'email_signup'
  ]
};

// Google Tag Manager Integration
export const gtmConfig = {
  GTM_ID: 'GTM-XXXXXXX', // Replace with your GTM ID
  
  // Enhanced E-commerce for Service Business
  trackServiceInquiries: true,
  trackConsultationBookings: true,
  trackResourceDownloads: true
};

// Search Console API Integration
export const searchConsoleConfig = {
  // Keywords to monitor rankings
  targetKeywords: [
    'AI automation services',
    'custom AI development', 
    'AI chatbot development',
    'business process automation',
    'AI consulting services',
    'AI implementation consulting',
    'automated customer service',
    'AI agents for business'
  ],
  
  // Pages to monitor performance
  keyPages: [
    '/',
    '/privacy',
    '/blog',
    '/services',
    '/contact'
  ]
};
