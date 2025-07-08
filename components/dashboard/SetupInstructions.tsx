'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface SetupInstructionsProps {
  onRetry: () => void
}

export default function SetupInstructions({ onRetry }: SetupInstructionsProps) {
  const [showInstructions, setShowInstructions] = useState(false)

  return (
    <div className="bg-white rounded-lg shadow p-8 text-center max-w-2xl mx-auto">
      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-3">
        One-Time Database Setup Required
      </h3>
      
      <p className="text-gray-600 mb-6">
        To enable automatic organization creation and team management, please run the one-time database migration script.
      </p>

      <div className="flex justify-center space-x-4 mb-6">
        <Button
          onClick={() => setShowInstructions(!showInstructions)}
          variant="outline"
        >
          {showInstructions ? 'Hide' : 'Show'} Setup Instructions
        </Button>
        <Button
          onClick={onRetry}
          className="bg-orange-400 hover:bg-orange-500"
        >
          Check Again
        </Button>
      </div>

      {showInstructions && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="text-left bg-gray-50 rounded-lg p-6 border"
        >
          <h4 className="font-semibold text-gray-900 mb-3">Setup Instructions:</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
            <li>Navigate to the <strong>SQL Editor</strong> tab</li>
            <li>Create a new query</li>
            <li>Copy the migration script from: <code className="bg-gray-200 px-2 py-1 rounded text-xs">migrations/add_team_management.sql</code></li>
            <li>Paste and run the script</li>
            <li>Come back here and click "Check Again"</li>
          </ol>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>What this does:</strong> Creates the database tables needed for automatic organization setup. 
              After this one-time setup, every user will automatically get their own organization when they log in.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
