import type { CSSProperties } from "react";

/**
 * A pillar box for the card to be posted into. The Figma file has no postbox
 * artwork, so this is drawn from plain shapes in the house palette — swap it
 * for an exported illustration when one exists.
 */
export const POSTBOX = {
  width: 300,
  height: 300,
  /** Distance from the top of the box down to the mouth of the slot. */
  slotTop: 118,
  slotHeight: 18,
  slotWidth: 212,
};

export function Postbox({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div aria-hidden className={`absolute ${className}`} style={style}>
      <div
        className="relative animate-[postbox-receive_2.4s_ease-out_forwards]"
        style={{ width: POSTBOX.width, height: POSTBOX.height }}
      >
        {/* Shadow on the ground */}
        <div className="absolute -bottom-[10px] left-1/2 h-[26px] w-[350px] -translate-x-1/2 rounded-[50%] bg-[#3a2517] opacity-25 blur-[8px]" />

        {/* One silhouette: domed cap into a straight body, lit from the left */}
        <div
          className="absolute inset-x-0 bottom-[18px] top-0 rounded-b-[10px] rounded-t-[150px]"
          style={{
            backgroundImage:
              "linear-gradient(100deg, #4a5a55 0%, #3d4c49 26%, #354442 52%, #29332f 82%, #1f2725 100%)",
          }}
        />

        {/* Brass collar, then the mouth cut into it */}
        <div
          className="absolute left-1/2 h-[7px] -translate-x-1/2 rounded-full bg-gold opacity-75"
          style={{ top: POSTBOX.slotTop - 13, width: POSTBOX.slotWidth + 18 }}
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-[9px] bg-black opacity-80 shadow-[inset_0_4px_7px_rgba(0,0,0,0.95)]"
          style={{
            top: POSTBOX.slotTop,
            width: POSTBOX.slotWidth,
            height: POSTBOX.slotHeight,
          }}
        />

        {/* Plinth */}
        <div className="absolute bottom-0 left-1/2 h-[20px] w-[322px] -translate-x-1/2 rounded-[6px] bg-[#2a3634]" />
        <div className="absolute bottom-[22px] left-1/2 h-[4px] w-[262px] -translate-x-1/2 rounded-full bg-gold opacity-40" />
      </div>
    </div>
  );
}
