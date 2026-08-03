import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  decimals = 0,
  className,
}: AnimatedCounterProps) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? value : 0);
  const displayRef = useRef(display);
  displayRef.current = display;

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    const start = displayRef.current;
    const diff = value - start;
    const duration = 700;
    const startedAt = performance.now();
    let frame = 0;

    function tick(now: number) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * eased);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [value, reduceMotion]);

  return <span className={className}>{display.toFixed(decimals)}</span>;
}
