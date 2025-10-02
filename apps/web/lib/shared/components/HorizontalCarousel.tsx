"use client"

import { ReactNode, useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

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
  const [isHovered, setIsHovered] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (scrollElement) {
      // Initial check
      checkScroll()
      
      // Add scroll event listener
      scrollElement.addEventListener('scroll', checkScroll)
      
      // Add resize observer to handle content changes
      const resizeObserver = new ResizeObserver(checkScroll)
      resizeObserver.observe(scrollElement)
      
      return () => {
        scrollElement.removeEventListener('scroll', checkScroll)
        resizeObserver.disconnect()
      }
    }
  }, [children])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      const newScrollLeft = direction === 'left' 
        ? scrollRef.current.scrollLeft - scrollAmount
        : scrollRef.current.scrollLeft + scrollAmount
      
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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

      {/* Left Navigation Caret - Only visible on hover and when can scroll left */}
      {isHovered && canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)'
          }}
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Right Navigation Caret - Only visible on hover and when can scroll right */}
      {isHovered && canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)'
          }}
          aria-label="Scroll right"
        >
          <ChevronRight size={20} />
        </button>
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
