"use client"

import { ReactNode, useRef } from "react"

interface HorizontalCarouselProps {
  children: ReactNode
  className?: string
  gap?: string
  showGradients?: boolean
}

export default function HorizontalCarousel({ 
  children, 
  className = "",
  gap = "space-x-3",
  showGradients = true
}: HorizontalCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  return (
    <div className="relative">
      {/* Left Gradient Fade */}
      {showGradients && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, var(--bg-secondary), transparent)'
          }}
        />
      )}
      
      {/* Right Gradient Fade */}
      {showGradients && (
        <div 
          className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to left, var(--bg-secondary), transparent)'
          }}
        />
      )}

      <div
        ref={scrollRef}
        className={`flex ${gap} overflow-x-auto py-3 px-4 scrollbar-hide scrollbar-none ${className}`}
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {children}
      </div>
      
      {/* Swipe Hint */}
      <div className="text-center mt-2">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          ← Desliza para ver más herramientas →
        </p>
      </div>
    </div>
  )
}
