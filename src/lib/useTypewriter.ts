import { useEffect, useState } from "react";

const CHARACTER_MS = 22;

/**
 * Types `text` out one character at a time. `skip()` jumps to the end, which is
 * what a tap does while the narration is still running.
 */
export function useTypewriter(text: string) {
  const [typed, setTyped] = useState({ text, count: 0 });

  // A new line starts from nothing — adjusted during render rather than in an
  // effect, so no frame of the previous line leaks through.
  if (typed.text !== text) setTyped({ text, count: 0 });

  const count = typed.text === text ? typed.count : 0;
  const isDone = count >= text.length;

  useEffect(() => {
    if (isDone) return;
    const tick = window.setInterval(() => {
      setTyped((current) =>
        current.count >= current.text.length
          ? current
          : { ...current, count: current.count + 1 },
      );
    }, CHARACTER_MS);
    return () => window.clearInterval(tick);
  }, [isDone, text]);

  return {
    shown: text.slice(0, count),
    isDone,
    skip: () => setTyped({ text, count: text.length }),
  };
}
