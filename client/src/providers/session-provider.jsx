"use client";

import { createContext, useContext, useMemo, useState } from "react";

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
  const [account, setAccount] = useState(session);
  const value = useMemo(
    () => ({
      ...account,
      initials: getInitials(account.name),
      plan: "Free",
      update: (changes) => setAccount((current) => ({ ...current, ...changes })),
    }),
    [account],
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
