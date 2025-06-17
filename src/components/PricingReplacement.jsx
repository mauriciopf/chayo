import React from "react";
import { motion } from "framer-motion";

const PricingReplacement = () => (
  <section
    id="pricing"
    className="py-20 bg-black text-white rounded-lg max-w-4xl mx-auto px-6 text-center"
  >
    <motion.h2
      className="text-3xl font-extrabold mb-6 text-white"
      initial={{ opacity: 0, y: -20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      Contact Us for Pricing
    </motion.h2>
    <motion.p
      className="text-lg max-w-xl mx-auto mb-8"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      We customize pricing to fit your unique business needs. Reach out to
      discuss how Agentic AI can bring transformative value to your company.
    </motion.p>
    <a
      href="#contact"
      className="inline-block bg-white text-orange-600 font-semibold rounded px-6 py-3 shadow hover:shadow-lg transition"
    >
      Get a Quote
    </a>
  </section>
);

export default PricingReplacement;
