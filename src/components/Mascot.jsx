import React from "react";
import { motion } from "framer-motion";

const ORANGE = "#E87811";
const ORANGE_LIGHT = "#FFB066";
const ORANGE_DARK = "#B85C0A";

const mascots = [
	{
		key: "robot",
		svg: (
			<svg
				width="120"
				height="120"
				viewBox="0 0 120 120"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<rect
					x="20"
					y="30"
					width="80"
					height="60"
					rx="20"
					fill="#222"
					stroke={ORANGE}
					strokeWidth="4"
				/>
				<circle cx="45" cy="55" r="8" fill={ORANGE} />
				<circle cx="75" cy="55" r="8" fill={ORANGE} />
				<path
					d="M45 75 Q60 90 75 75"
					stroke={ORANGE}
					strokeWidth="3"
					fill="none"
					strokeLinecap="round"
				/>
				<rect x="58" y="15" width="4" height="15" rx="2" fill={ORANGE} />
				<circle cx="60" cy="13" r="4" fill={ORANGE} />
			</svg>
		),
		animate: { y: [0, -20, 0] },
		transition: {
			duration: 2,
			repeat: Infinity,
			repeatType: "loop",
			delay: 0,
		},
	},
	{
		key: "chat",
		svg: (
			<svg
				width="120"
				height="120"
				viewBox="0 0 120 120"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<ellipse
					cx="60"
					cy="60"
					rx="40"
					ry="30"
					fill={ORANGE_LIGHT}
				/>
				<rect
					x="40"
					y="80"
					width="40"
					height="18"
					rx="9"
					fill={ORANGE_LIGHT}
				/>
				<circle cx="50" cy="60" r="5" fill="#fff" />
				<circle cx="60" cy="60" r="5" fill="#fff" />
				<circle cx="70" cy="60" r="5" fill="#fff" />
			</svg>
		),
		animate: { scale: [1, 1.15, 1] },
		transition: {
			duration: 2.2,
			repeat: Infinity,
			repeatType: "loop",
			delay: 0.3,
		},
	},
	{
		key: "analytics",
		svg: (
			<svg
				width="120"
				height="120"
				viewBox="0 0 120 120"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<rect
					x="30"
					y="70"
					width="12"
					height="30"
					rx="6"
					fill={ORANGE_DARK}
				/>
				<rect
					x="54"
					y="50"
					width="12"
					height="50"
					rx="6"
					fill={ORANGE_LIGHT}
				/>
				<rect
					x="78"
					y="40"
					width="12"
					height="60"
					rx="6"
					fill={ORANGE}
				/>
				<circle
					cx="60"
					cy="30"
					r="10"
					fill="#fff"
					stroke={ORANGE_LIGHT}
					strokeWidth="3"
				/>
			</svg>
		),
		animate: { rotate: [0, 10, -10, 0] },
		transition: {
			duration: 2.5,
			repeat: Infinity,
			repeatType: "loop",
			delay: 0.6,
		},
	},
	{
		key: "link",
		svg: (
			<svg
				width="120"
				height="120"
				viewBox="0 0 120 120"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<rect
					x="30"
					y="60"
					width="60"
					height="20"
					rx="10"
					fill="#222"
					stroke={ORANGE}
					strokeWidth="4"
				/>
				<circle cx="40" cy="70" r="10" fill={ORANGE_LIGHT} />
				<circle cx="80" cy="70" r="10" fill={ORANGE_DARK} />
				<rect x="55" y="40" width="10" height="40" rx="5" fill={ORANGE} />
			</svg>
		),
		animate: { x: [0, 15, -15, 0] },
		transition: {
			duration: 2.8,
			repeat: Infinity,
			repeatType: "loop",
			delay: 0.9,
		},
	},
];

const Mascot = () => (
	<div className="flex gap-2 sm:gap-4 md:gap-8 items-center justify-center flex-row flex-wrap py-4 max-w-full">
		{mascots.map((m) => (
			<motion.div
				key={m.key}
				className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 bg-black rounded-full flex items-center justify-center shadow-lg border border-gray-800 flex-shrink-0 cursor-pointer"
				animate={m.animate}
				transition={m.transition}
				whileHover={{ scale: 1.18, rotate: 8 }}
				whileTap={{ scale: 0.92, rotate: -8 }}
				aria-label={`Agentic AI Mascot ${m.key}`}
				role="img"
			>
				{m.svg}
			</motion.div>
		))}
	</div>
);

export default Mascot;
