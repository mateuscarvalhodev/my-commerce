import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQueryList = window.matchMedia(MOBILE_MEDIA_QUERY);
  mediaQueryList.addEventListener("change", onStoreChange);

  return () => {
    mediaQueryList.removeEventListener("change", onStoreChange);
  };
}

function getSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
