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
  const [focus, setFocus] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFocus = (field) => setFocus(field);
  const handleBlur = () => setFocus("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // No backend, so just simulate submit
  };

  return (
    <section
      id="contact"
      className="py-20 max-w-3xl mx-auto px-6 bg-black text-white rounded-2xl shadow-2xl border border-gray-800"
    >
      <h2 className="text-3xl font-bold mb-8 text-center text-white">
        Get in Touch
      </h2>
      {submitted ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-green-400 font-semibold"
        >
          Thank you for reaching out! We will get back to you soon.
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                placeholder="Your Name"
                autoComplete="name"
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
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                placeholder="Your Email"
                autoComplete="email"
              />
            </motion.div>
          </div>
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
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              placeholder="Company (optional)"
              autoComplete="organization"
            />
          </motion.div>
          <motion.div
            animate={focus === "message" ? "focus" : ""}
            variants={fieldVariants}
            className="relative"
          >
            <textarea
              required
              id="message"
              name="message"
              rows="5"
              value={formData.message}
              onChange={handleChange}
              onFocus={() => handleFocus("message")}
              onBlur={handleBlur}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-400 transition resize-none"
              placeholder="How can we help you?"
            />
          </motion.div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg px-6 py-3 hover:from-orange-600 hover:to-orange-700 shadow-lg transition text-lg tracking-wide"
          >
            Send Message
          </button>
        </form>
      )}
    </section>
  );
};

export default Contact;
