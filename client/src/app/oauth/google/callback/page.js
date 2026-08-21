"use client";

import Link from "next/link";
import { useEffect } from "react";

const MESSAGE_TYPE = "datadock:google-auth";
const CHANNEL_NAME = "datadock:google-auth";

export default function GoogleCallbackPage() {
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const status = search.get("status") === "success" ? "success" : "error";
    const code = search.get("code");
    const result = {
      type: MESSAGE_TYPE,
      status,
      code,
    };
    const channel = new BroadcastChannel(CHANNEL_NAME);

    channel.postMessage(result);

    if (window.opener) {
      window.opener.postMessage(result, window.location.origin);
    }

    window.setTimeout(() => {
      channel.close();
      window.close();
    }, 100);
  }, []);

  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="flex max-w-sm flex-col gap-3">
        <h1 className="text-xl font-semibold text-foreground">Google login complete</h1>
        <p className="text-base text-muted-foreground">
          You can close this window and return to DataDock.
        </p>
        <Link href="/login" className="text-base font-medium text-brand">
          Return to login
        </Link>
      </div>
    </main>
  );
}
