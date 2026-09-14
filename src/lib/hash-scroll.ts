const SUPPORTED_HASH_TARGETS = new Set(["order", "order-confirmation"]);

export function scrollToRenderedHash(hash: string, documentRef: Pick<Document, "getElementById"> = document): boolean {
  let id: string;
  try {
    id = decodeURIComponent(hash.replace(/^#/, ""));
  } catch {
    return false;
  }
  if (!SUPPORTED_HASH_TARGETS.has(id)) return false;
  const target = documentRef.getElementById(id);
  if (!target) return false;
  target.scrollIntoView({ behavior: "smooth", block: id === "order-confirmation" ? "center" : "start" });
  target.focus({ preventScroll: true });
  return true;
}

export function installRenderedHashScrolling(windowRef: Window = window, documentRef: Document = document) {
  let retryTimer: number | undefined;
  let cancelled = false;

  const schedule = () => {
    if (retryTimer !== undefined) windowRef.clearTimeout(retryTimer);
    let attemptsRemaining = 8;
    const attempt = () => {
      if (cancelled || scrollToRenderedHash(windowRef.location.hash, documentRef)) return;
      if (attemptsRemaining-- > 0) retryTimer = windowRef.setTimeout(attempt, 50);
    };
    windowRef.requestAnimationFrame(attempt);
  };
  const handleSamePageLink = (event: Event) => {
    const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
    if (anchor) windowRef.requestAnimationFrame(schedule);
  };

  windowRef.addEventListener("hashchange", schedule);
  windowRef.addEventListener("popstate", schedule);
  documentRef.addEventListener("click", handleSamePageLink);
  schedule();

  return () => {
    cancelled = true;
    if (retryTimer !== undefined) windowRef.clearTimeout(retryTimer);
    windowRef.removeEventListener("hashchange", schedule);
    windowRef.removeEventListener("popstate", schedule);
    documentRef.removeEventListener("click", handleSamePageLink);
  };
}
