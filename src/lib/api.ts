import type { PostcardDraft } from "./flow";

export type SubmitResult = { id: string; deliverOn: string };

/**
 * Hands the finished postcard to the delivery service. There is no backend
 * yet, so this resolves after a short delay — swap the body for the real
 * endpoint and the Sending screen keeps working unchanged.
 */
export async function submitPostcard(draft: PostcardDraft): Promise<SubmitResult> {
  await new Promise((resolve) => setTimeout(resolve, 2600));

  const deliverOn = new Date(draft.writtenOn);
  deliverOn.setFullYear(deliverOn.getFullYear() + 1);

  return { id: crypto.randomUUID(), deliverOn: deliverOn.toISOString() };
}
