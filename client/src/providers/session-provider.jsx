"use client";

import { createContext, useContext, useMemo } from "react";

const SessionContext = createContext(null);

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function SessionProvider({ session, children }) {
  const value = useMemo(
    () => ({
      ...session,
      initials: getInitials(session.name),
      plan: "Free",
    }),
    [session],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);

  if (!session) {
    throw new Error("useSession must be used inside SessionProvider");
  }

  return session;
}
