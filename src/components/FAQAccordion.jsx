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

export default function FAQAccordion() {
	const [open, setOpen] = useState(null);
	return (
		<section id="faq" className="relative max-w-3xl mx-auto my-16 px-4">
			{/* Animated orange/cyan glow */}
			<motion.div
				className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-24 bg-gradient-to-r from-orange-500 via-cyan-400 to-orange-400 opacity-30 blur-3xl rounded-full z-0 animate-pulse"
				aria-hidden="true"
			/>
			<motion.div
				className="section-glass border-2 border-orange-400/40 shadow-2xl p-8 md:p-12 relative overflow-hidden"
				initial={{ opacity: 0, y: 40 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.8 }}
			>
				<div className="flex flex-col items-center mb-8">
					<span className="text-4xl md:text-5xl mb-2 animate-float-slow">
						💡
					</span>
					<h2 className="text-3xl md:text-4xl font-extrabold text-center bg-gradient-to-r from-orange-400 via-cyan-400 to-orange-400 bg-clip-text text-transparent mb-2 drop-shadow-lg">
						Frequently Asked Questions
					</h2>
					<p className="text-orange-100 text-center max-w-xl mx-auto text-lg mb-2">
						Everything you need to know about Agentic AI, automation, and how we
						help your business grow.
					</p>
				</div>
				<div className="space-y-5">
					{faqs.map((faq, i) => (
						<motion.div
							key={i}
							className="bg-white/10 backdrop-blur-xl rounded-2xl border border-orange-300/30 shadow-lg overflow-hidden group"
							whileHover={{
								scale: 1.03,
								boxShadow: "0 0 32px #fb923c",
							}}
							transition={{ type: "spring", duration: 0.4 }}
						>
							<button
								className="w-full text-left px-6 py-5 text-lg md:text-xl font-semibold text-orange-200 flex justify-between items-center focus:outline-none group-hover:text-orange-300 transition-colors"
								onClick={() => setOpen(open === i ? null : i)}
								aria-expanded={open === i}
							>
								<span className="flex items-center gap-2">
									<span className="text-2xl md:text-3xl">
										{open === i ? "🟠" : "🔸"}
									</span>
									{faq.q}
								</span>
								<span className="ml-4 text-orange-400 text-3xl font-bold transition-transform group-hover:rotate-90">
									{open === i ? "-" : "+"}
								</span>
							</button>
							<AnimatePresence initial={false}>
								{open === i && (
									<motion.div
										key="content"
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.3 }}
										className="overflow-hidden px-8 pb-6 text-orange-100 text-base md:text-lg mt-2"
									>
										{faq.a}
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
