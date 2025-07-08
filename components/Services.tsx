import React from "react";
import { motion } from "framer-motion";

const services = [
	{
		title: "AI Automation Agents",
		icon: "🤖",
		shortDescription: "24/7 intelligent automation",
		description: "Smart AI chatbots and automation agents that handle customer support, lead generation, and business processes around the clock. Increase efficiency while reducing operational costs.",
		features: ["Customer Support Automation", "Lead Generation", "Process Optimization", "24/7 Availability"],
	},
	{
		title: "Custom AI Development",
		icon: "⚡",
		shortDescription: "Tailored AI solutions",
		description: "Bespoke AI solutions designed specifically for your business needs. From chatbot development to complex process automation, we build AI that fits your unique requirements.",
		features: ["Custom Chatbots", "Process Automation", "AI Integration", "Scalable Solutions"],
	},
	{
		title: "Business Intelligence",
		icon: "📊",
		shortDescription: "AI-powered insights",
		description: "Transform your data into actionable insights with AI-powered analytics. Automated reporting and business intelligence that drives informed decision-making and strategic growth.",
		features: ["Data Analytics", "Automated Reporting", "Predictive Insights", "Business Intelligence"],
	},
	{
		title: "System Integration",
		icon: "🔗",
		shortDescription: "Seamless connectivity",
		description: "Connect AI seamlessly with your existing tools and workflows. We ensure smooth integration that enhances rather than disrupts your current operations.",
		features: ["API Integration", "Workflow Automation", "System Connectivity", "Legacy Support"],
	},
];

const Services = ({ darkMode }) => (
	<section id="services" className="relative py-12 sm:py-16 md:py-24 transition-colors duration-300 bg-gray-50 text-gray-900">
		{/* Subtle background gradient */}
		<div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 via-emerald-300/5 to-emerald-500/5 opacity-60" />
		
		<div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
			{/* Section Header - Mobile Optimized & Elegant */}
			<div className="text-center mb-8 sm:mb-12 md:mb-16">
				<motion.h2
					className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light mb-4 sm:mb-6 tracking-tight leading-tight"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					<span className="text-gray-900">Our</span>{' '}
					<span className="bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent font-medium">
						Services
					</span>
				</motion.h2>
				<motion.p
					className="text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed px-2 sm:px-0 text-gray-600"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.2 }}
				>
					Comprehensive AI solutions designed to streamline operations, enhance customer experiences, 
					and accelerate business growth through intelligent automation.
				</motion.p>
			</div>

			{/* Services Grid - Mobile First Design */}
			<div className="space-y-6 sm:space-y-8 md:grid md:grid-cols-1 lg:grid-cols-2 md:gap-8 lg:gap-12 md:space-y-0">
				{services.map(({ title, icon, shortDescription, description, features }, index) => (
					<motion.div
						key={title}
						className="group relative p-6 sm:p-8 md:p-10 lg:p-12 rounded-3xl border border-gray-100/80 bg-white/95 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-500 md:hover:scale-[1.02] hover:border-emerald-200/60"
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: index * 0.1 }}
						whileHover={{ 
							boxShadow: "0 25px 50px rgba(16, 185, 129, 0.08), 0 0 0 1px rgba(16, 185, 129, 0.05)"
						}}
					>
						{/* Mobile-First Service Header */}
						<div className="text-center sm:text-left mb-4 sm:mb-6">
							{/* Icon - Larger on Mobile for Touch */}
							<div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 mx-auto sm:mx-0 mb-4 sm:mb-5 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/50 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
								{icon}
							</div>
							
							{/* Title and Description - Smaller, more elegant */}
							<h3 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-2 tracking-tight text-gray-900 group-hover:text-emerald-700 transition-colors duration-300">
								{title}
							</h3>
							<p className="text-sm sm:text-base text-emerald-600 font-medium mb-4">
								{shortDescription}
							</p>
						</div>

						{/* Service Description - More spacing on mobile */}
						<p className="text-base sm:text-lg md:text-xl leading-relaxed mb-6 sm:mb-8 text-gray-600 font-light">
							{description}
						</p>

						{/* Features List - Mobile Optimized */}
						<div className="space-y-3 sm:space-y-4">
							<h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4 text-gray-800">
								Key Features
							</h4>
							{/* Stack features vertically on mobile for better readability */}
							<ul className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
								{features.map((feature, idx) => (
									<motion.li
										key={idx}
										className="flex items-center text-sm sm:text-base text-gray-700 font-medium"
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ duration: 0.4, delay: index * 0.1 + idx * 0.1 }}
									>
										<span className="w-2.5 h-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full mr-3 flex-shrink-0 shadow-sm" />
										{feature}
									</motion.li>
								))}
							</ul>
						</div>

						{/* Elegant Hover Effect */}
						<motion.div
							className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-50/50 via-white/30 to-emerald-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
							style={{ pointerEvents: 'none' }}
						/>
						
						{/* Subtle Border Glow on Hover */}
						<div className="absolute inset-0 rounded-3xl ring-1 ring-emerald-200/0 group-hover:ring-emerald-200/40 transition-all duration-500" />
					</motion.div>
				))}
			</div>

			{/* Call to Action - Mobile Optimized */}
			<motion.div
				className="text-center mt-12 sm:mt-16 md:mt-20 px-2 sm:px-0"
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 0.6 }}
			>
				<h3 className="text-lg sm:text-xl md:text-2xl font-light mb-3 sm:mb-4 text-gray-900">
					Ready to Transform Your Business?
				</h3>
				<p className="text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed text-gray-600">
					Let's discuss how our AI solutions can streamline your operations and drive growth.
				</p>
				<motion.a
					href="http://chayo.ai/#/startaicall"
					className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 text-base sm:text-lg"
					whileHover={{ scale: 1.05, y: -2 }}
					whileTap={{ scale: 0.98 }}
				>
					Start Your AI Journey
				</motion.a>
			</motion.div>
		</div>
	</section>
);

export default Services;
