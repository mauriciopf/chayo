import { motion } from 'framer-motion'

export default function LoadingScreen({ message, isAutoStarting }: { message: string, isAutoStarting?: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"
        />
        <p className="text-gray-600">{message}</p>
        {isAutoStarting && (
          <p className="text-sm text-purple-600 mt-2">Starting conversation...</p>
        )}
      </div>
    </div>
  )
} 