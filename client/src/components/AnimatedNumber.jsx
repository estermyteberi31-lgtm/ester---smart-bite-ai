import { useEffect, useRef, useState } from "react";

/**
 * Counts up (or down) from its previous value to `value` whenever `value`
 * changes, instead of snapping straight to the new number.
 */
export default function AnimatedNumber({ value, duration = 600, formatter, className }) {
  const numericValue = Number(value) || 0;
  const [displayValue, setDisplayValue] = useState(numericValue);
  const fromRef = useRef(numericValue);
  const startRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplayValue(numericValue);
      return;
    }

    fromRef.current = displayValue;
    startRef.current = null;
    const from = fromRef.current;
    const delta = numericValue - from;
    let frameId;

    function tick(timestamp) {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplayValue(from + delta * eased);
      if (progress < 1) frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericValue, duration]);

  return <span className={className}>{formatter ? formatter(displayValue) : Math.round(displayValue)}</span>;
}
