import React from "react";
import { motion } from "framer-motion";

const PricingReplacement = ({ darkMode }) => {
  const hourlyPackages = [
    {
      hours: 50,
      title: "Starter Package",
      description: "Perfect for small projects and initial assessments",
      features: [
        "AI Strategy Consultation",
        "Process Analysis & Documentation",
        "Proof of Concept Development",
        "Implementation Roadmap",
        "2 Weeks of Support"
      ],
      price: "$7,500",
      hourlyRate: "$150/hour",
      popular: false,
      gradient: "from-blue-500/20 to-cyan-500/20",
      borderGradient: "from-blue-500 to-cyan-500"
    },
    {
      hours: 100,
      title: "Growth Package",
      description: "Ideal for medium-scale AI implementations",
      features: [
        "Complete AI Solution Development",
        "Custom Automation Systems",
        "Data Integration & Processing",
        "Training & Knowledge Transfer",
        "1 Month of Premium Support",
        "Performance Optimization"
      ],
      price: "$14,000",
      hourlyRate: "$140/hour",
      popular: true,
      gradient: "from-orange-500/20 to-amber-500/20",
      borderGradient: "from-orange-500 to-amber-500"
    },
    {
      hours: 150,
      title: "Enterprise Package",
      description: "Comprehensive solutions for large-scale transformations",
      features: [
        "End-to-End AI Transformation",
        "Multi-System Integration",
        "Advanced Machine Learning Models",
        "Team Training & Workshops",
        "3 Months of Enterprise Support",
        "Ongoing Optimization & Monitoring",
        "Priority Response (24/7)"
      ],
      price: "$19,500",
      hourlyRate: "$130/hour",
      popular: false,
      gradient: "from-purple-500/20 to-pink-500/20",
      borderGradient: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <section
      id="pricing"
      className={`py-12 sm:py-16 md:py-20 transition-colors duration-300 ${
        darkMode 
          ? 'text-white' 
          : 'text-gray-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <motion.div
            className={`inline-flex items-center gap-2 backdrop-blur-sm border rounded-full px-4 sm:px-6 py-2 mb-4 sm:mb-6 ${
              darkMode 
                ? 'bg-white/5 border-white/10' 
                : 'bg-gray-900/5 border-gray-900/10'
            }`}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className={`text-xs sm:text-sm font-medium ${
              darkMode ? 'text-white/80' : 'text-gray-700'
            }`}>Senior Engineering Hours</span>
          </motion.div>

          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light mb-4 sm:mb-6 tracking-tight px-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>Transparent</span>{' '}
            <span className="bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-500 bg-clip-text text-transparent">Pricing</span>
          </motion.h2>

          <motion.p
            className={`text-base sm:text-lg md:text-xl leading-relaxed text-center px-2 max-w-3xl mx-auto ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            We're not a one-size-fits-all solution. As a specialized consulting agency, we bill by the hour 
            because every business has unique needs. Purchase bundles of senior engineer hours and get
            <span className="text-orange-400 font-semibold"> better rates with larger commitments</span>.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {hourlyPackages.map((pkg, index) => (
            <motion.div
              key={pkg.hours}
              className={`relative group ${pkg.popular ? 'md:-mt-4' : ''}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Card */}
              <div 
                className={`relative h-full backdrop-blur-xl border rounded-2xl p-8 overflow-hidden group-hover:border-opacity-30 transition-all duration-300 ${
                  darkMode 
                    ? `bg-gradient-to-br ${pkg.gradient} border-white/10 group-hover:border-white/20` 
                    : `bg-gradient-to-br from-white/80 to-gray-50/80 border-gray-200/50 group-hover:border-gray-300/50 shadow-lg`
                }`}
              >
                {/* Glow Effect */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-br ${pkg.borderGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl`}
                />

                <div className="relative z-10">
                  {/* Hours & Title */}
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${pkg.borderGradient} rounded-full mb-4`}>
                      <span className="text-2xl font-bold text-white">{pkg.hours}</span>
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>{pkg.title}</h3>
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>{pkg.description}</p>
                  </div>

                  {/* Pricing */}
                  <div className="text-center mb-8">
                    <div className={`text-4xl font-bold mb-1 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>{pkg.price}</div>
                    <div className={`text-sm mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>{pkg.hours} engineering hours</div>
                    <div className={`text-sm font-medium bg-gradient-to-r ${pkg.borderGradient} bg-clip-text text-transparent`}>
                      {pkg.hourlyRate} (Save ${150 * pkg.hours - parseInt(pkg.price.replace(/[^0-9]/g, ''))})
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${pkg.borderGradient} flex items-center justify-center mt-0.5 flex-shrink-0`}>
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className={`text-sm leading-tight ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <motion.a
                    href="#contact"
                    className={`block w-full text-center py-4 rounded-xl font-semibold transition-all duration-300 ${
                      pkg.popular 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg hover:shadow-orange-500/25' 
                        : darkMode 
                          ? 'bg-white/10 text-white hover:bg-white/20' 
                          : 'bg-gray-900/10 text-gray-900 hover:bg-gray-900/20'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Get Started
                  </motion.a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Info */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className={`backdrop-blur-sm border rounded-2xl p-8 w-full ${
            darkMode 
              ? 'bg-white/5 border-white/10' 
              : 'bg-white/60 border-gray-200/50 shadow-lg'
          }`}>
            <h3 className={`text-2xl font-bold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>Why Choose Hourly Consulting?</h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className={`font-semibold mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Flexibility</h4>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Scale up or down based on your project needs and timeline</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className={`font-semibold mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Transparency</h4>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Know exactly what you're paying for with detailed time tracking</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <h4 className={`font-semibold mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Customization</h4>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Every solution is tailored specifically to your business requirements</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingReplacement;
