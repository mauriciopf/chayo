import { motion, AnimatePresence } from "framer-motion";

export default function DemoModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-black rounded-2xl p-8 max-w-md w-full shadow-2xl border border-orange-400 relative"
            initial={{ scale: 0.8, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 40 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <button
              className="absolute top-3 right-3 text-orange-300 hover:text-orange-500 text-2xl font-bold"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-2xl font-bold mb-4 text-orange-200 text-center">Try Agentic AI</h3>
            <div className="bg-black/80 rounded-lg p-4 border border-gray-700 mb-4">
              <div className="text-left text-orange-100 text-sm mb-2">AI Agent:</div>
              <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-lg px-4 py-2 mb-2 w-fit animate-pulse">Hi! 👋 How can I help automate your business today?</div>
              <div className="text-left text-cyan-100 text-xs">(This is a demo preview. Real AI chat coming soon!)</div>
            </div>
            <button
              className="mt-4 w-full bg-gradient-to-r from-orange-400 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-lg hover:from-orange-500 hover:to-orange-700 transition"
              onClick={onClose}
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
