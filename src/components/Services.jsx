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
		icon: "�",
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
	<section id="services" className={`relative py-16 md:py-24 transition-colors duration-300 ${
		darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
	}`}>
		{/* Subtle background gradient */}
		<div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 via-cyan-400/5 to-violet-500/5 opacity-60" />
		
		<div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
			{/* Section Header */}
			<div className="text-center mb-16 md:mb-20">
				<motion.h2
					className="text-4xl md:text-6xl font-black mb-6 tracking-tight"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					<span className={darkMode ? 'text-white' : 'text-gray-900'}>Our</span>{' '}
					<span className="bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-500 bg-clip-text text-transparent">
						Services
					</span>
				</motion.h2>
				<motion.p
					className={`text-lg md:text-xl max-w-3xl mx-auto leading-relaxed ${
						darkMode ? 'text-gray-300' : 'text-gray-600'
					}`}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.2 }}
				>
					Comprehensive AI solutions designed to streamline operations, enhance customer experiences, 
					and accelerate business growth through intelligent automation.
				</motion.p>
			</div>

			{/* Services Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
				{services.map(({ title, icon, shortDescription, description, features }, index) => (
					<motion.div
						key={title}
						className={`group relative p-8 md:p-10 rounded-3xl border-2 transition-all duration-300 hover:scale-[1.02] ${
							darkMode 
								? 'bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-gray-700/50 hover:border-cyan-400/50 backdrop-blur-lg' 
								: 'bg-gradient-to-br from-white/80 to-gray-100/40 border-gray-200/60 hover:border-orange-400/50 backdrop-blur-lg'
						} shadow-xl hover:shadow-2xl`}
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: index * 0.1 }}
						whileHover={{ 
							boxShadow: darkMode 
								? "0 25px 50px rgba(6, 182, 212, 0.15)" 
								: "0 25px 50px rgba(232, 120, 17, 0.15)"
						}}
					>
						{/* Service Icon */}
						<motion.div
							className="flex items-center mb-6"
							whileHover={{ scale: 1.05 }}
							transition={{ type: "spring", stiffness: 300 }}
						>
							<div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl md:text-4xl mr-6 ${
								darkMode 
									? 'bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600' 
									: 'bg-gradient-to-br from-white to-gray-100 border border-gray-200'
							} shadow-lg`}>
								{icon}
							</div>
							<div>
								<h3 className={`text-xl md:text-2xl font-bold mb-2 ${
									darkMode ? 'text-white' : 'text-gray-900'
								}`}>
									{title}
								</h3>
								<p className={`text-sm md:text-base ${
									darkMode ? 'text-cyan-400' : 'text-orange-500'
								} font-semibold`}>
									{shortDescription}
								</p>
							</div>
						</motion.div>

						{/* Service Description */}
						<p className={`text-base md:text-lg leading-relaxed mb-6 ${
							darkMode ? 'text-gray-300' : 'text-gray-600'
						}`}>
							{description}
						</p>

						{/* Features List */}
						<div className="space-y-3">
							<h4 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
								darkMode ? 'text-gray-400' : 'text-gray-500'
							}`}>
								Key Features
							</h4>
							<ul className="grid grid-cols-2 gap-2">
								{features.map((feature, idx) => (
									<motion.li
										key={idx}
										className={`flex items-center text-sm ${
											darkMode ? 'text-gray-300' : 'text-gray-600'
										}`}
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ duration: 0.4, delay: index * 0.1 + idx * 0.1 }}
									>
										<span className="w-2 h-2 bg-gradient-to-r from-orange-400 to-cyan-400 rounded-full mr-3 flex-shrink-0" />
										{feature}
									</motion.li>
								))}
							</ul>
						</div>

						{/* Hover Effect Gradient */}
						<motion.div
							className="absolute inset-0 rounded-3xl bg-gradient-to-r from-orange-400/10 via-cyan-400/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
							style={{ pointerEvents: 'none' }}
						/>
					</motion.div>
				))}
			</div>

			{/* Call to Action */}
			<motion.div
				className="text-center mt-16 md:mt-20"
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 0.6 }}
			>
				<h3 className={`text-2xl md:text-3xl font-bold mb-4 ${
					darkMode ? 'text-white' : 'text-gray-900'
				}`}>
					Ready to Transform Your Business?
				</h3>
				<p className={`text-lg mb-8 max-w-2xl mx-auto ${
					darkMode ? 'text-gray-300' : 'text-gray-600'
				}`}>
					Let's discuss how our AI solutions can streamline your operations and drive growth.
				</p>
				<motion.a
					href="http://ageantic.ai/#/startaicall"
					className="inline-block px-8 py-4 bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-500 text-white font-bold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 text-lg"
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
