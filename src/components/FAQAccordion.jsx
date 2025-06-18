import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
	{
		q: "How fast can Agentic AI deploy automation for my business?",
		a: "Most clients are up and running in under 2 weeks, with custom AI agents tailored to your workflows.",
	},
	{
		q: "Is my data secure?",
		a: "Absolutely. We use enterprise-grade encryption and comply with GDPR and other major standards.",
	},
	{
		q: "Can Agentic AI integrate with my existing tools?",
		a: "Yes! We support integration with CRMs, e-commerce, messaging, and more.",
	},
	{
		q: "Do I need technical expertise to use Agentic AI?",
		a: "No technical skills required. Our team handles setup, and you get a simple dashboard to manage everything.",
	},
	{
		q: "What business outcomes can I expect?",
		a: "You can expect up to 60% cost reduction, 24/7 instant customer service, and the ability to scale your team instantly as your business grows.",
	},
	{
		q: "Which industries benefit most from Agentic AI?",
		a: "E-commerce, healthcare, real estate, and professional services all benefit from our tailored AI automation solutions.",
	},
	{
		q: "What kind of support do you provide?",
		a: "We offer ongoing support, continuous improvement, and dedicated AI experts for your business.",
	},
	{
		q: "Is Agentic AI compliant with privacy regulations?",
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

export default function FAQAccordion() {
	const [open, setOpen] = useState(null);
	return (
		<section id="faq" className="relative max-w-4xl mx-auto my-32 px-2 sm:px-6">
			{/* Dramatic animated gradient and glassy overlays for FAQ */}
			<motion.div
				className="absolute -top-32 left-1/2 -translate-x-1/2 w-[60vw] h-40 bg-gradient-to-r from-cyan-400 via-orange-400 to-cyan-400 opacity-30 blur-3xl rounded-full z-0 animate-float-slow"
				aria-hidden="true"
				animate={{ scale: [1, 1.08, 1], rotate: [0, 8, -8, 0] }}
				transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
			/>
			<motion.div
				className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-16 bg-gradient-to-r from-white/40 via-cyan-400/20 to-orange-400/20 opacity-20 blur-lg rounded-full z-0 pointer-events-none"
				animate={{ opacity: [0.12, 0.22, 0.12], scale: [1, 1.04, 1] }}
				transition={{ duration: 10, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
			/>
			{/* Floating accent sparkles */}
			{[...Array(6)].map((_, i) => (
				<motion.span
					key={i}
					className="absolute rounded-full blur-2xl"
					style={{
						width: 18 + i * 4,
						height: 18 + i * 4,
						background: i % 2 === 0 ? '#E87811' : '#06b6d4',
						top: `${20 + i * 10}%`,
						left: `${10 + i * 15}%`,
						opacity: 0.3 + (i % 2) * 0.1,
						zIndex: 1,
					}}
					animate={{ y: [0, -10, 10, 0] }}
					transition={{ duration: 7 + i, repeat: Infinity, repeatType: 'mirror', delay: i * 0.2 }}
				/>
			))}
			<motion.div
				className="relative z-10 py-12 px-2 sm:px-6 md:px-16 bg-transparent shadow-none flex flex-col items-center"
				initial={{ opacity: 0, y: 40 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.8 }}
			>
				<div className="flex flex-col items-center mb-10">
					<motion.span
						className="text-5xl md:text-6xl mb-2 animate-float-slow select-none drop-shadow-2xl"
						animate={{ rotate: [0, 10, -10, 0] }}
						transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
					>
						💡
					</motion.span>
					<h2 className="text-4xl md:text-5xl font-extrabold text-center bg-gradient-to-r from-orange-400 via-cyan-400 to-orange-400 bg-clip-text text-transparent mb-2 drop-shadow-2xl">
						Frequently Asked Questions
					</h2>
					<p className="text-lg text-gray-700 dark:text-gray-200 max-w-xl text-center mt-2">
						Everything you need to know about Agentic AI.
					</p>
				</div>
				<div className="w-full space-y-2 sm:space-y-4">
					{faqs.map((faq, i) => (
						<motion.div
							key={i}
							className="relative group border-l-4 border-cyan-400/60 pl-6 py-2 bg-transparent transition-all duration-300"
							initial={{ opacity: 0, y: 40, scale: 0.96, rotate: -2 }}
							whileInView={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
							viewport={{ once: true }}
							whileHover={{ scale: 1.06, boxShadow: '0 4px 32px 0 rgba(6,182,212,0.18)', rotate: 2 }}
							animate={{ y: [0, -4, 4, 0], rotate: [0, 2, -2, 0] }}
							transition={{ duration: 3, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', ...{ delay: i * 0.08 } }}
						>
							<button
								onClick={() => setOpen(open === i ? null : i)}
								className={`w-full flex justify-between items-center py-3 px-0 focus:outline-none bg-transparent hover:bg-cyan-400/10 dark:hover:bg-cyan-300/10 rounded-none transition-all duration-300 border-none shadow-none`}
								aria-expanded={open === i}
								whileHover={{ x: 10, scale: 1.04, color: '#06b6d4', textShadow: '0 2px 16px #06b6d4' }}
							>
								<span
									className={`text-lg md:text-xl font-semibold uppercase tracking-wider letter-spacing-wide transition-all duration-300 flex items-center gap-2 ${
										open === i
											? "text-cyan-400 dark:text-cyan-300 font-bold drop-shadow-cyan animate-pulse"
											: "text-gray-900 dark:text-white"
									}`}
								>
									{faq.q}
									{/* Animated accent ✦ for open item */}
									{open === i && (
										<motion.span
											className="ml-2 text-cyan-400 text-xl animate-float-slow"
											initial={{ opacity: 0, y: -6 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -6 }}
											transition={{ duration: 0.3 }}
										/>
									)}
								</span>
								<motion.span
									className={`ml-4 transition-transform ${open === i ? 'text-cyan-400 drop-shadow-cyan animate-float-slow' : 'text-gray-400 group-hover:text-cyan-400'}`}
									animate={{ rotate: open === i ? 180 : 0 }}
									whileHover={{ rotate: 25, scale: 1.25, color: '#06b6d4' }}
								>
									▾
								</motion.span>
							</button>
							{/* Animated glowing underline accent for open item */}
							<motion.div
								className="absolute left-0 right-0 h-1 rounded-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 shadow-cyan-400/30 shadow-lg"
								initial={{ scaleX: 0 }}
								animate={{ scaleX: open === i ? 1 : 0 }}
								transition={{ duration: 0.35, type: 'spring' }}
								style={{ originX: 0 }}
								whileHover={{ scaleY: 1.3, background: 'linear-gradient(90deg,#06b6d4,#fff,#06b6d4)' }}
							/>
							<AnimatePresence initial={false}>
								{open === i && (
									<motion.div
										initial={{ height: 0, opacity: 0, x: -20 }}
										animate={{ height: "auto", opacity: 1, x: 0 }}
										exit={{ height: 0, opacity: 0, x: 20 }}
										transition={{ duration: 0.3 }}
										className="overflow-hidden"
									>
										<p className="text-base text-gray-700 dark:text-gray-200 mt-2 px-1 animate-pulse">
											{faq.a}
										</p>
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					))}
				</div>
			</motion.div>
		</section>
	);
}
