"use client";

import { useEffect } from "react";

export default function GoogleDriveCallbackPage() {
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    window.opener?.postMessage(
      {
        type: "datadock:google-drive",
        status: search.get("status") === "success" ? "success" : "error",
        code: search.get("code"),
      },
      window.location.origin,
    );
    window.setTimeout(() => window.close(), 100);
  }, []);

  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <p className="text-base text-muted-foreground">
        Google Drive connection complete. You can close this window.
      </p>
    </main>
  );
}
