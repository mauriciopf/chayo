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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-green-500 font-semibold text-lg mt-8"
          >
            Thank you for reaching out! We will get back to you soon.
          </motion.div>
        ) : (
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
                className="bg-gradient-to-r from-orange-400 via-cyan-400 to-orange-400 text-white font-bold py-3 px-10 rounded-full shadow-lg hover:scale-105 transition-transform text-lg"
              >
                Send Message
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default Contact;
