"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

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
  const update = useCallback(
    (changes) => setAccount((current) => ({ ...current, ...changes })),
    [],
  );
  const value = useMemo(
    () => ({
      ...account,
      initials: getInitials(account.name),
      plan: account.plan ?? "Free",
      update,
    }),
    [account, update],
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
