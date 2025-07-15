'use client'

import { useState } from 'react'
import StartACall from '@/components/StartACall'

export default function StartACallPage() {
  const [darkMode, setDarkMode] = useState(true)

  return (
    <div className="min-h-screen">
      <StartACall 
        darkMode={darkMode} 
        setDarkMode={setDarkMode}
      />
    </div>
  )
}
