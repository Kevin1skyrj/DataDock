"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

import { ACCENT_IDS, ACCENT_STORAGE_KEY, DEFAULT_ACCENT } from "@/constants/accents";

const AccentContext = createContext(null);

/**
 * Runs before paint so a stored accent never flashes through as blue.
 * Mirrors how next-themes avoids the same problem for light/dark.
 */
export const accentNoFlashScript = `(function(){try{var a=localStorage.getItem("${ACCENT_STORAGE_KEY}");if(${JSON.stringify(
  ACCENT_IDS,
)}.indexOf(a)>-1){document.documentElement.dataset.accent=a}}catch(e){}})();`;

/**
 * The accent lives on `<html data-accent>`, written before hydration by the
 * script above. That makes the DOM the source of truth and React a subscriber,
 * which is what useSyncExternalStore is for — no setState inside an effect,
 * and no cascading render on mount.
 */
const listeners = new Set();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(onStoreChange) {
  listeners.add(onStoreChange);
  // Keep sibling tabs in sync.
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSnapshot() {
  const accent = document.documentElement.dataset.accent;
  return ACCENT_IDS.includes(accent) ? accent : DEFAULT_ACCENT;
}

function getServerSnapshot() {
  return DEFAULT_ACCENT;
}

export function AccentProvider({ children }) {
  const accent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setAccent = useCallback((next) => {
    if (!ACCENT_IDS.includes(next)) return;
    document.documentElement.dataset.accent = next;
    try {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, next);
    } catch {
      // Private browsing — the accent still applies for this session.
    }
    emit();
  }, []);

  const value = useMemo(() => ({ accent, setAccent }), [accent, setAccent]);

  return <AccentContext.Provider value={value}>{children}</AccentContext.Provider>;
}

export function useAccent() {
  const context = useContext(AccentContext);
  if (!context) throw new Error("useAccent must be used within an AccentProvider");
  return context;
}
