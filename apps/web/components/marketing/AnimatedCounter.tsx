import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({ value, duration = 1.5, className = "" }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<number | undefined>(undefined);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value.toString()) || 0; // Default to 0 if value is invalid
    if (start === end) {
      setCount(end);
      return;
    }
    
    let increment = end / (duration * 60);
    let current = start;
    
    function updateCounter() {
      current += increment;
      if (current >= end) {
        setCount(end);
      } else {
        setCount(Math.floor(current));
        ref.current = requestAnimationFrame(updateCounter);
      }
    }
    
    ref.current = requestAnimationFrame(updateCounter);
    return () => {
      if (ref.current) {
        cancelAnimationFrame(ref.current);
      }
    };
  }, [value, duration]);

  return <span className={className}>{count}</span>;
}
