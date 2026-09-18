import { useState } from "react";

/**
 * Tracks whether the line that is fading in has arrived.
 *
 * The fade itself is a CSS animation keyed on the beat — see `.animate-beat-in`
 * in `index.css`. This only holds the state around it: whether the line has
 * settled, and `settle()` for a tap that finishes it early, which is the same
 * courtesy the typed narration used to offer.
 */
export function useFadeIn(id: string | number) {
  const [state, setState] = useState({ id, settled: false });

  // A new line starts unsettled — adjusted during render rather than in an
  // effect, so no frame of the previous line's state leaks through.
  if (state.id !== id) setState({ id, settled: false });

  return {
    settled: state.id === id && state.settled,
    settle: () => setState({ id, settled: true }),
  };
}
