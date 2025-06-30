import React, { useState } from "react";
import { motion } from "framer-motion";

const steps = [
	{ title: "Consultation", icon: "🤝", description: "Understanding your unique business needs and AI opportunities" },
	{ title: "Strategy", icon: "📋", description: "Designing tailored AI solutions that align with your goals" },
	{ title: "Development", icon: "⚙️", description: "Building and testing your custom AI systems" },
	{ title: "Deployment", icon: "🚀", description: "Seamless integration and go-live support" }
];

const industries = [
	{ title: "E-commerce", icon: "🛒", description: "Automated customer service and order management" },
	{ title: "Healthcare", icon: "🏥", description: "Patient scheduling and support automation" },
	{ title: "Real Estate", icon: "🏠", description: "Lead qualification and property inquiries" },
	{ title: "Professional Services", icon: "💼", description: "Client onboarding and consultation booking" }
];

export default function IndustryProcess({ darkMode }) {
	const [selectedStep, setSelectedStep] = useState(null);

	return (
		<section 
			id="industry-process" 
			className={`relative py-20 md:py-32 transition-colors duration-300 ${
				darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
			}`}
		>
			{/* Subtle background gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-orange-400/5 pointer-events-none" />
			
			<div className="relative z-10 max-w-6xl mx-auto px-6 md:px-8">
				{/* Section Header */}
				<div className="text-center mb-20 md:mb-28">
					<motion.h2
						className="text-4xl md:text-5xl lg:text-6xl font-light mb-8 tracking-tight leading-tight"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
					>
						<span className={darkMode ? 'text-white' : 'text-gray-900'}>How</span>{' '}
						<span className="bg-gradient-to-r from-cyan-500 to-orange-500 bg-clip-text text-transparent font-medium">
							AI Works
						</span>{' '}
						<span className={darkMode ? 'text-white' : 'text-gray-900'}>for Your Industry</span>
					</motion.h2>
					<motion.p 
						className={`text-lg md:text-xl font-light max-w-3xl mx-auto leading-relaxed ${
							darkMode ? 'text-gray-300' : 'text-gray-600'
						}`}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
					>
						From strategy to deployment—see how we deliver AI-powered transformation tailored to your business
					</motion.p>
				</div>

				{/* Process Steps */}
				<div className="mb-24 md:mb-32">
					<h3 className={`text-2xl md:text-3xl font-light text-center mb-16 ${
						darkMode ? 'text-white' : 'text-gray-900'
					}`}>
						Our Process
					</h3>
					
					<div className="grid md:grid-cols-4 gap-8 md:gap-6">
						{steps.map((step, index) => (
							<motion.div
								key={step.title}
								className={`relative p-8 rounded-2xl text-center cursor-pointer transition-all duration-300 ${
									darkMode 
										? 'bg-gray-800/40 border border-gray-700/30 hover:bg-gray-800/60 hover:border-cyan-400/30'
										: 'bg-gray-50/60 border border-gray-200/40 hover:bg-white/80 hover:border-cyan-400/40'
								} ${selectedStep === index ? 'ring-2 ring-cyan-400/50' : ''} backdrop-blur-sm`}
								onClick={() => setSelectedStep(selectedStep === index ? null : index)}
								whileHover={{ y: -4 }}
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: index * 0.15 }}
							>
								{/* Step number */}
								<div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
									darkMode ? 'bg-cyan-500 text-white' : 'bg-cyan-500 text-white'
								} shadow-lg`}>
									{index + 1}
								</div>

								{/* Icon */}
								<div className="text-4xl mb-6">{step.icon}</div>
								
								{/* Title */}
								<h4 className={`text-lg font-semibold mb-4 ${
									darkMode ? 'text-white' : 'text-gray-900'
								}`}>
									{step.title}
								</h4>
								
								{/* Description */}
								<p className={`text-sm leading-relaxed ${
									darkMode ? 'text-gray-300' : 'text-gray-600'
								}`}>
									{step.description}
								</p>

								{/* Connection line for desktop */}
								{index < steps.length - 1 && (
									<div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-cyan-400/60 to-orange-400/60" />
								)}
							</motion.div>
						))}
					</div>
				</div>

				{/* Industries */}
				<div className="mb-16">
					<h3 className={`text-2xl md:text-3xl font-light text-center mb-16 ${
						darkMode ? 'text-white' : 'text-gray-900'
					}`}>
						Industries We Serve
					</h3>
					
					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
						{industries.map((industry, index) => (
							<motion.div
								key={industry.title}
								className={`p-6 rounded-xl text-center transition-all duration-300 ${
									darkMode 
										? 'bg-gray-800/40 border border-gray-700/30 hover:bg-gray-800/60 hover:border-orange-400/30'
										: 'bg-gray-50/60 border border-gray-200/40 hover:bg-white/80 hover:border-orange-400/40'
								} backdrop-blur-sm`}
								whileHover={{ y: -2 }}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
							>
								{/* Icon */}
								<div className="text-3xl mb-4">{industry.icon}</div>
								
								{/* Title */}
								<h4 className={`text-lg font-semibold mb-3 ${
									darkMode ? 'text-white' : 'text-gray-900'
								}`}>
									{industry.title}
								</h4>
								
								{/* Description */}
								<p className={`text-sm leading-relaxed ${
									darkMode ? 'text-gray-300' : 'text-gray-600'
								}`}>
									{industry.description}
								</p>
							</motion.div>
						))}
					</div>
				</div>

				{/* Call to Action */}
				<motion.div 
					className="text-center"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.8 }}
				>
					<h3 className={`text-2xl md:text-3xl font-light mb-6 ${
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
						className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-orange-500 text-white font-medium rounded-full hover:from-cyan-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl"
						whileHover={{ scale: 1.05, y: -2 }}
						whileTap={{ scale: 0.98 }}
					>
						Start Your AI Transformation
						<svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
					</motion.a>
				</motion.div>
			</div>
		</section>
	);
}
