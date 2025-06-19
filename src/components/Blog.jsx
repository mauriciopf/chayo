import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const BlogPost = ({ title, excerpt, slug, date, readTime, category }) => (
  <motion.article
    className="bg-gradient-to-br from-gray-900/80 to-black/60 rounded-2xl p-6 border border-orange-400/20 hover:border-cyan-400/40 transition-all duration-300 hover:scale-105"
    whileHover={{ y: -5 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex items-center gap-4 mb-4">
      <span className="px-3 py-1 bg-gradient-to-r from-orange-400 to-cyan-400 text-black text-xs font-bold rounded-full">
        {category}
      </span>
      <span className="text-gray-400 text-sm">{readTime} min read</span>
    </div>
    
    <h3 className="text-xl font-bold text-white mb-3 hover:text-orange-400 transition-colors">
      <Link to={`/blog/${slug}`}>{title}</Link>
    </h3>
    
    <p className="text-gray-300 mb-4 leading-relaxed">{excerpt}</p>
    
    <div className="flex justify-between items-center">
      <span className="text-gray-500 text-sm">{date}</span>
      <Link
        to={`/blog/${slug}`}
        className="text-cyan-400 hover:text-cyan-300 font-semibold text-sm hover:underline"
      >
        Read More →
      </Link>
    </div>
  </motion.article>
);

const Blog = () => {
  const blogPosts = [
    {
      title: "How AI Automation Reduced Costs by 60% for E-commerce Businesses",
      excerpt: "Discover the exact AI strategies that helped online retailers automate customer service, inventory management, and marketing campaigns.",
      slug: "ai-automation-ecommerce-cost-reduction",
      date: "June 15, 2025",
      readTime: 8,
      category: "Case Study"
    },
    {
      title: "The Complete Guide to Implementing AI Chatbots in 2025",
      excerpt: "Step-by-step tutorial on building, deploying, and optimizing AI chatbots for maximum customer engagement and conversion.",
      slug: "complete-guide-ai-chatbots-2025",
      date: "June 12, 2025", 
      readTime: 12,
      category: "Tutorial"
    },
    {
      title: "5 AI Automation Trends That Will Transform Business Operations",
      excerpt: "Explore the latest AI trends in process automation, predictive analytics, and intelligent decision-making systems.",
      slug: "ai-automation-trends-2025",
      date: "June 8, 2025",
      readTime: 6,
      category: "Industry Insights"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-20">
      {/* Hero Section */}
      <section className="relative py-20">
        <motion.div
          className="absolute left-1/2 top-0 -translate-x-1/2 w-[60vw] h-40 bg-gradient-to-r from-cyan-400 via-orange-400 to-cyan-400 opacity-20 blur-3xl rounded-full z-0"
          animate={{ scale: [1, 1.08, 1], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror' }}
        />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.h1 
            className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-orange-400 via-cyan-400 to-orange-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            AI Automation Insights
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-300 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Expert insights, case studies, and tutorials on AI automation for modern businesses
          </motion.p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <BlogPost key={post.slug} {...post} />
          ))}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 max-w-2xl mx-auto px-4 text-center">
        <motion.div
          className="bg-gradient-to-br from-gray-900/80 to-black/60 rounded-2xl p-8 border border-orange-400/20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h3 className="text-2xl font-bold text-white mb-4">Stay Updated</h3>
          <p className="text-gray-300 mb-6">Get the latest AI automation insights delivered to your inbox</p>
          <div className="flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-black/60 border border-gray-600 rounded-lg text-white focus:border-orange-400 outline-none"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-orange-400 to-cyan-400 text-black font-bold rounded-lg hover:scale-105 transition-transform">
              Subscribe
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Blog;
