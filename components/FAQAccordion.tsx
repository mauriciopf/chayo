import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
	{
		q: "How fast can Chayo AI deploy automation for my business?",
		a: "Most clients are up and running in under 2 weeks, with custom AI agents tailored to your workflows.",
	},
	{
		q: "Is my data secure?",
		a: "Absolutely. We use enterprise-grade encryption and comply with GDPR and other major standards.",
	},
	{
		q: "Can Chayo AI integrate with my existing tools?",
		a: "Yes! We support integration with CRMs, e-commerce, messaging, and more.",
	},
	{
		q: "Do I need technical expertise to use Chayo AI?",
		a: "No technical skills required. Our team handles setup, and you get a simple dashboard to manage everything.",
	},
	{
		q: "What business outcomes can I expect?",
		a: "You can expect up to 60% cost reduction, 24/7 instant customer service, and the ability to scale your team instantly as your business grows.",
	},
	{
		q: "Which industries benefit most from Chayo AI?",
		a: "E-commerce, healthcare, real estate, and professional services all benefit from our tailored AI automation solutions.",
	},
	{
		q: "What kind of support do you provide?",
		a: "We offer ongoing support, continuous improvement, and dedicated AI experts for your business.",
	},
	{
		q: "Is Chayo AI compliant with privacy regulations?",
		a: "Yes, we are GDPR-ready and privacy-focused, ensuring your data is always protected.",
	},
];

const sparkVariants = {
	initial: { opacity: 0, scale: 0.5 },
	animate: (i) => ({
		opacity: 0.5,
		scale: 1,
		transition: { delay: 1.2 + i * 0.2, duration: 0.8, yoyo: Infinity },
	}),
};
const sparks = [
	{ top: "8%", left: "18%", color: "#E87811" },
	{ top: "22%", left: "80%", color: "#FFB066" },
	{ top: "70%", left: "10%", color: "#06b6d4" },
	{ top: "60%", left: "70%", color: "#a78bfa" },
	{ top: "30%", left: "60%", color: "#FFB066" },
];

export default function FAQAccordion({ darkMode }) {
	const [open, setOpen] = useState(null);
	return (
		<section id="faq" className="relative w-full my-12 sm:my-16 md:my-24 lg:my-32 px-4 sm:px-6 md:px-8">
			{/* Dramatic animated gradient - mobile optimized */}
			<motion.div
				className="absolute -top-12 sm:-top-16 md:-top-24 left-1/2 -translate-x-1/2 w-[90vw] sm:w-[70vw] md:w-[60vw] h-12 sm:h-24 md:h-40 bg-gradient-to-r from-cyan-400 via-orange-400 to-cyan-400 opacity-30 blur-3xl rounded-full z-0 animate-float-slow"
				aria-hidden="true"
				animate={{ scale: [1, 1.08, 1], rotate: [0, 8, -8, 0] }}
				transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
			/>
			<motion.div
				className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] sm:w-[50vw] md:w-[40vw] h-4 sm:h-8 md:h-16 bg-gradient-to-r from-white/40 via-cyan-400/20 to-orange-400/20 opacity-20 blur-lg rounded-full z-0 pointer-events-none"
				animate={{ opacity: [0.12, 0.22, 0.12], scale: [1, 1.04, 1] }}
				transition={{ duration: 10, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
			/>
			{/* Floating accent sparkles - fewer on mobile */}
			{[...Array(4)].map((_, i) => (
				<motion.span
					key={i}
					className={`absolute rounded-full blur-2xl ${i > 1 ? 'hidden sm:block' : ''}`}
					style={{
						width: 10 + i * 3,
						height: 10 + i * 3,
						background: i % 2 === 0 ? '#E87811' : '#06b6d4',
						top: `${20 + i * 15}%`,
						left: `${10 + i * 20}%`,
						opacity: 0.3 + (i % 2) * 0.1,
						zIndex: 1,
					}}
					animate={{ y: [0, -10, 10, 0] }}
					transition={{ duration: 7 + i, repeat: Infinity, repeatType: 'mirror', delay: i * 0.2 }}
				/>
			))}
			<motion.div
				className="relative z-10 py-6 sm:py-8 md:py-10 lg:py-12 px-2 sm:px-4 md:px-6 lg:px-16 bg-transparent shadow-none flex flex-col items-center"
				initial={{ opacity: 0, y: 40 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.8 }}
			>
				<div className="flex flex-col items-center mb-8 sm:mb-10 md:mb-12">
					<motion.div
						className="mb-4 sm:mb-6"
						animate={{ rotate: [0, 10, -10, 0] }}
						transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
					>
						<div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-3xl sm:text-4xl md:text-5xl ${
							darkMode 
								? 'bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/30' 
								: 'bg-gradient-to-br from-white/80 to-gray-100/40 border border-gray-200/40'
						} backdrop-blur-sm shadow-lg`}>
							💡
						</div>
					</motion.div>
					
					<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-center mb-3 sm:mb-4 tracking-tight">
						<span className={darkMode ? 'text-white' : 'text-gray-900'}>Frequently Asked</span>{' '}
						<span className="bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-500 bg-clip-text text-transparent font-medium">
							Questions
						</span>
					</h2>
					
					<p className={`text-base sm:text-lg md:text-xl max-w-2xl text-center leading-relaxed ${
						darkMode ? 'text-gray-300' : 'text-gray-600'
					}`}>
						Everything you need to know about our AI solutions and how they can transform your business.
					</p>
				</div>
				<div className="w-full max-w-4xl space-y-3 sm:space-y-4">
					{faqs.map((faq, i) => (
						<motion.div
							key={i}
							className={`relative group overflow-hidden rounded-xl sm:rounded-2xl transition-all duration-300 ${
								darkMode 
									? 'bg-gray-800/40 border border-gray-700/30 hover:bg-gray-800/60 hover:border-cyan-400/30' 
									: 'bg-white/80 border border-gray-200/40 hover:bg-white/90 hover:border-orange-400/40'
							} backdrop-blur-sm shadow-lg hover:shadow-xl`}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.6, delay: i * 0.1 }}
							whileHover={{ y: -2 }}
						>
							<button
								onClick={() => setOpen(open === i ? null : i)}
								className={`w-full flex justify-between items-center p-4 sm:p-6 focus:outline-none text-left transition-all duration-300 ${
									darkMode 
										? 'text-white' 
										: 'text-gray-900'
								}`}
							>
								<span className="text-base sm:text-lg md:text-xl font-semibold leading-relaxed pr-4">
									{faq.q}
								</span>
								<motion.div
									className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
										darkMode 
											? 'bg-cyan-500/20 text-cyan-400' 
											: 'bg-orange-500/20 text-orange-500'
									} transition-all duration-300`}
									animate={{ rotate: open === i ? 45 : 0 }}
									transition={{ duration: 0.2 }}
								>
									<span className="text-lg sm:text-xl font-bold">+</span>
								</motion.div>
							</button>
							
							<AnimatePresence>
								{open === i && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										exit={{ opacity: 0, height: 0 }}
										transition={{ duration: 0.4, ease: "easeInOut" }}
										className="overflow-hidden"
									>
										<div className={`px-4 sm:px-6 pb-4 sm:pb-6 pt-0 text-sm sm:text-base md:text-lg leading-relaxed ${
											darkMode ? 'text-gray-300' : 'text-gray-600'
										}`}>
											<div className={`w-full h-px mb-4 ${
												darkMode ? 'bg-gray-700/50' : 'bg-gray-200/50'
											}`} />
											{faq.a}
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					))}
				</div>
				
				{/* Call to Action Section */}
				<motion.div 
					className="text-center mt-12 sm:mt-16 md:mt-20"
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.8, delay: 0.3 }}
				>
					<h3 className={`text-xl sm:text-2xl md:text-3xl font-light mb-4 sm:mb-6 ${
						darkMode ? 'text-white' : 'text-gray-900'
					}`}>
						Still have questions?
					</h3>
					<p className={`text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed ${
						darkMode ? 'text-gray-300' : 'text-gray-600'
					}`}>
						Our AI experts are here to help. Let's discuss your specific needs and how we can transform your business.
					</p>
					<motion.a
						href="http://chayo.ai/#/startaicall"
						className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-cyan-500 text-white font-semibold rounded-full hover:from-orange-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base"
						whileHover={{ scale: 1.05, y: -2 }}
						whileTap={{ scale: 0.98 }}
					>
						Get Expert Consultation
						<svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
						</svg>
					</motion.a>
				</motion.div>
			</motion.div>
		</section>
	);
}
