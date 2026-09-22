/**
 * Artwork exported from the Figma file and committed under `public/assets`.
 * Referenced by URL (not imported) so the files stay byte-identical to the
 * exports and are served straight from the public directory.
 */
export const ASSETS = {
  paperTexture: "/assets/paper-texture.png",
  artboard: "/assets/raffles-artboard.jpg",
  hotelFacade: "/assets/hotel-facade.png",
  logoMark: "/assets/logo-brand-text-mark.svg",
  /* The same lockup set wide, 190 x 47 — the preview frames use this one, and
     `logoMark` is the stacked 80 x 71 the kiosk uses. They are not
     interchangeable: forcing either into the other's box flattens it. */
  logoWordmarkWide: "/assets/logo-wordmark-wide.svg",
  wordmark: "/assets/wordmark-postcard-to-the-future.png",
  introGlow: "/assets/intro-card-glow.svg",
  /** Single chevron; the left arrow is the same file rotated. */
  arrowRight: "/assets/arrow-right.svg",
  close: "/assets/close.svg",
  caret: "/assets/caret.svg",
  scrollHand: "/assets/scroll-hand.svg",
  promptsStack: "/assets/prompts-stack.svg",
  stamp: "/assets/stamp.png",
  postbox: "/assets/postbox.png",
  postcardTiffin: "/assets/postcard-photo-side.png",
  postcardGreetings: "/assets/postcard-carousel-item.png",
  coverCardBack: "/assets/cover-card-back.svg",
  coverCardFront: "/assets/cover-card-front.svg",
  coverStampPhoto: "/assets/cover-stamp-photo.png",
  coverStampCancel: "/assets/cover-stamp-cancel.svg",
  coverStampFrame: "/assets/cover-stamp-frame.svg",
  thankYouCardBack: "/assets/thankyou-card-back.svg",
  thankYouCardFront: "/assets/thankyou-card-front.svg",
} as const;
