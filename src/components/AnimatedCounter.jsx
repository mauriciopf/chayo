import { useEffect, useRef, useState } from "react";

export default function AnimatedCounter({ value, duration = 1.5, className = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef();

  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0; // Default to 0 if value is invalid
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
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);

  return <span className={className}>{count}</span>;
}
