export const createAbortController = (reason: string) => {
  const controller = new AbortController();
  console.log(`[AbortController] Created with reason: ${reason}`);
  return controller;
};

export const abortWithReason = (controller: AbortController, reason: string) => {
  if (controller.signal.aborted) {
    console.log(`[AbortController] Already aborted, skipping abort for reason: ${reason}`);
    return;
  }
  console.log(`[AbortController] Aborting with reason: ${reason}`);
  controller.abort(reason);
};