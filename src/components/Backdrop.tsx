import { ASSETS } from "../lib/assets";
import { useStageTone } from "../lib/stageTone";
import { Bleed } from "./Stage";

type BackdropProps = {
  /** Base paper colour; the Thank You screen swaps it for deep green. */
  tone?: "parchment" | "forest";
  /** The archival hotel artboard washed in behind the paper. */
  artboard?: boolean;
};

/**
 * Every screen sits on the same three layers: flat paper, a linen texture
 * multiplied over it, and a warm vignette burned into the edges.
 *
 * All of it is rendered through `<Bleed>`, which puts it behind the frame at the
 * size of the screen rather than the size of the design. On a tablet whose shape
 * is not the design's, the paper runs to the edges instead of stopping at a
 * boundary — and because the texture is applied once, over the whole screen,
 * there is no seam where the frame ends.
 */
export function Backdrop({ tone = "parchment", artboard = false }: BackdropProps) {
  const base = tone === "forest" ? "bg-forest-dark" : "bg-parchment";

  // A fallback for the frame before the ground layer mounts.
  useStageTone(tone);

  return (
    <Bleed>
      <div aria-hidden className={`absolute inset-0 overflow-hidden ${base}`}>
        {artboard && (
          <>
            <div className="absolute inset-0 bg-parchment-light opacity-40" />
            <img
              src={ASSETS.artboard}
              alt=""
              className="absolute inset-0 h-full w-full max-w-none object-cover opacity-20"
            />
          </>
        )}

        {/*
          A div rather than an <img>, because an absolutely positioned replaced
          element ignores `bottom` when its height is auto and resolves `height:
          100%` against the containing block rather than the inset box — either
          way it stops short of a tall screen and leaves a step where the grain
          ends. A background image obeys the insets.
        */}
        <div
          className="absolute -inset-x-[12%] -inset-y-[7%] rotate-180 opacity-84 mix-blend-multiply"
          style={{
            backgroundImage: `url(${ASSETS.paperTexture})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div
          className={`absolute inset-0 mix-blend-soft-light ${base}`}
          style={{ boxShadow: "inset 0 4px 62.8px 8px rgba(131, 103, 66, 0.53)" }}
        />
      </div>
    </Bleed>
  );
}
