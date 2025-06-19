import React, { useState } from "react";
import { motion } from "framer-motion";

const fieldVariants = {
  focus: { borderColor: "#E87811", boxShadow: "0 0 0 2px #E87811" },
};

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [focus, setFocus] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFocus = (field) => setFocus(field);
  const handleBlur = () => setFocus("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Replace YOUR_FORM_ID with your actual Formspree form ID
      const response = await fetch("https://formspree.io/f/xldnwryo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          message: formData.message,
          _replyto: formData.email,
          _subject: `New AI Consultation Request from ${formData.name}`,
          _cc: "mauricio.perezflores@gmail.com",
          _format: "plain",
          _language: "en",
          _next: "https://ageantic.ai/thank-you"
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          name: "",
          email: "",
          company: "",
          message: "",
        });
      } else {
        throw new Error("Failed to send message");
      }
    } catch (err) {
      setError("Failed to send message. Please try again or contact us directly at mauricio.perezflores@gmail.com");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative py-24 max-w-2xl mx-auto px-6 flex flex-col items-center"
    >
      {/* Floating blurred accent shape */}
      <motion.div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-32 bg-gradient-to-r from-orange-400 via-cyan-400 to-orange-300 opacity-30 blur-3xl rounded-full z-0 animate-pulse"
        aria-hidden="true"
      />
      <div className="relative z-10 w-full flex flex-col items-center">
        <h2 className="text-4xl font-extrabold text-center bg-gradient-to-r from-orange-400 via-cyan-400 to-orange-400 bg-clip-text text-transparent mb-8 drop-shadow-xl">
          Get in Touch
        </h2>
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center text-green-400 font-semibold text-lg mt-8 p-6 bg-green-400/10 rounded-xl border border-green-400/20"
          >
            <div className="text-2xl mb-2">✅</div>
            Thank you for reaching out! We will get back to you soon.
          </motion.div>
        ) : (
          <div className="w-full">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-red-400 font-medium text-sm mb-6 p-4 bg-red-400/10 rounded-xl border border-red-400/20"
              >
                {error}
              </motion.div>
            )}
            <form onSubmit={handleSubmit} className="space-y-8 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                animate={focus === "name" ? "focus" : ""}
                variants={fieldVariants}
                className="relative"
              >
                <input
                  required
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => handleFocus("name")}
                  onBlur={handleBlur}
                  placeholder="Name"
                  className="w-full bg-white/70 dark:bg-black/60 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl py-4 px-6 outline-none focus:ring-2 focus:ring-orange-400 transition-all shadow-md"
                />
              </motion.div>
              <motion.div
                animate={focus === "email" ? "focus" : ""}
                variants={fieldVariants}
                className="relative"
              >
                <input
                  required
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => handleFocus("email")}
                  onBlur={handleBlur}
                  placeholder="Email"
                  className="w-full bg-white/70 dark:bg-black/60 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl py-4 px-6 outline-none focus:ring-2 focus:ring-orange-400 transition-all shadow-md"
                />
              </motion.div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                animate={focus === "company" ? "focus" : ""}
                variants={fieldVariants}
                className="relative"
              >
                <input
                  id="company"
                  name="company"
                  type="text"
                  value={formData.company}
                  onChange={handleChange}
                  onFocus={() => handleFocus("company")}
                  onBlur={handleBlur}
                  placeholder="Company (optional)"
                  className="w-full bg-white/70 dark:bg-black/60 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl py-4 px-6 outline-none focus:ring-2 focus:ring-orange-400 transition-all shadow-md"
                />
              </motion.div>
              <motion.div
                animate={focus === "message" ? "focus" : ""}
                variants={fieldVariants}
                className="relative md:col-span-1 col-span-1"
              >
                <textarea
                  required
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  onFocus={() => handleFocus("message")}
                  onBlur={handleBlur}
                  placeholder="Your message"
                  rows={3}
                  className="w-full bg-white/70 dark:bg-black/60 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl py-4 px-6 outline-none focus:ring-2 focus:ring-orange-400 transition-all shadow-md resize-none"
                />
              </motion.div>
            </div>
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-orange-400 via-cyan-400 to-orange-400 text-white font-bold py-3 px-10 rounded-full shadow-lg hover:scale-105 transition-transform text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Send Message"
                )}
              </button>
            </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
};

export default Contact;
