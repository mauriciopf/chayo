import React from "react";
import { motion } from "framer-motion";

const solutions = [
	{
		title: "Customer Service AI",
		description:
			"Enhance customer experience with AI chatbots and support automation across all channels.",
		icon: "💬",
		color: "from-gray-900 to-gray-800",
	},
	{
		title: "Predictive Analytics",
		description:
			"Anticipate market trends and customer behavior with advanced AI models and real-time insights.",
		icon: "🔮",
		color: "from-gray-900 to-gray-800",
	},
	{
		title: "AI-Powered Marketing",
		description:
			"Optimize campaigns, personalize outreach, and increase ROI using machine learning insights.",
		icon: "📈",
		color: "from-gray-800 to-gray-900",
	},
	{
		title: "Voice & Messaging Automation",
		description:
			"Automate WhatsApp, SMS, and even voice calls with smart, context-aware AI agents.",
		icon: "📞",
		color: "from-gray-800 to-gray-900",
	},
	{
		title: "Order & Booking Automation",
		description:
			"Let AI handle product questions, order updates, and appointment bookings 24/7.",
		icon: "🛒",
		color: "from-gray-900 to-gray-800",
	},
	{
		title: "Custom Integrations",
		description:
			"Connect AI solutions with your existing tools and platforms for seamless automation.",
		icon: "🔗",
		color: "from-gray-900 to-gray-800",
	},
];

const cardVariants = {
	hidden: { opacity: 0, y: 40, scale: 0.95 },
	show: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { duration: 0.7, type: "spring" },
	},
};

const Solutions = () => (
	<section id="solutions" className="py-20 bg-black text-white">
		<motion.h2
			className="text-3xl font-bold text-center mb-12 text-white"
			initial={{ opacity: 0, y: -30 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.8 }}
		>
			AI Solutions for Every Industry
		</motion.h2>
		<div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 px-2 md:px-0">
			{solutions.map(({ title, description, icon }, i) => (
				<motion.div
					key={title}
					variants={cardVariants}
					initial="hidden"
					whileInView="show"
					viewport={{ once: true }}
					whileHover={{ scale: 1.08 }}
					className="relative rounded-3xl p-8 shadow-2xl border border-orange-300/30 bg-white/10 backdrop-blur-xl overflow-hidden flex flex-col items-center text-center transition-all duration-300 group"
				>
					{/* Animated glowing border */}
					<span className="absolute inset-0 rounded-3xl pointer-events-none border-2 border-transparent group-hover:border-orange-400 group-hover:shadow-[0_0_32px_8px_#fb923c] transition-all duration-300" />
					{/* Floating accent spark */}
					<span className="absolute top-3 right-3 w-3 h-3 bg-gradient-to-br from-orange-400 to-orange-300 rounded-full blur-sm opacity-80 animate-pulse" />
					<div className="text-5xl mb-4 drop-shadow-lg bg-gradient-to-br from-orange-400 via-orange-300 to-yellow-200 bg-clip-text text-transparent animate-float-slow">
						{icon}
					</div>
					<h3 className="text-xl font-bold mb-2 text-white drop-shadow-lg tracking-tight">
						{title}
					</h3>
					<p className="text-orange-100 text-base opacity-90 leading-relaxed">
						{description}
					</p>
				</motion.div>
			))}
		</div>
	</section>
);

export default Solutions;
