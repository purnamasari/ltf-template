import { ASSETS } from "../lib/assets";

type BackdropProps = {
  /** Base paper colour; the Thank You screen swaps it for deep green. */
  tone?: "parchment" | "forest";
  /** The archival hotel artboard washed in behind the paper. */
  artboard?: boolean;
};

/**
 * Every screen sits on the same three layers: flat paper, a linen texture
 * multiplied over it, and a warm vignette burned into the edges.
 */
export function Backdrop({ tone = "parchment", artboard = false }: BackdropProps) {
  const base = tone === "forest" ? "bg-forest-dark" : "bg-parchment";

  return (
    <div aria-hidden className={`absolute inset-0 overflow-hidden ${base}`}>
      {artboard && (
        <>
          <div className="absolute -left-[313px] -top-[56px] h-[880px] w-[1543px] bg-parchment-light opacity-40" />
          <img
            src={ASSETS.artboard}
            alt=""
            className="absolute -left-[85px] -top-[33px] h-[880px] w-[1543px] max-w-none object-cover opacity-20"
          />
        </>
      )}

      <img
        src={ASSETS.paperTexture}
        alt=""
        className="absolute -inset-x-[12%] -inset-y-[7%] max-w-none rotate-180 object-cover opacity-84 mix-blend-multiply"
      />

      <div
        className={`absolute inset-0 mix-blend-soft-light ${base}`}
        style={{ boxShadow: "inset 0 4px 62.8px 8px rgba(131, 103, 66, 0.53)" }}
      />
    </div>
  );
}
