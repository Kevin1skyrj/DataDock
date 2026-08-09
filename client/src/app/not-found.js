import { FileQuestion } from "lucide-react";
import Link from "next/link";

import { Notice } from "@/components/common/notice";
import { PageAtmosphere } from "@/components/common/page-atmosphere";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Page not found",
  description: "That page does not exist.",
};

/**
 * The 404.
 *
 * Lit like the landing page and the authentication screens rather than like the
 * application, because whoever lands here arrived from outside — a stale link, a
 * mistyped address, a bookmark that outlived the page. It should look like the
 * product's front door, not like a broken room inside it.
 *
 * Two ways out, and the second one matters more than it looks: a signed-in
 * visitor who mistypes a dashboard URL wants their drive back, not the marketing
 * page. Offering only "home" would send them somewhere they were not going.
 */
export default function NotFound() {
  return (
    <>
      <PageAtmosphere />

      <main className="flex min-h-dvh items-center justify-center px-5 py-16">
        <Notice
          code="Error 404"
          icon={FileQuestion}
          title="This page doesn't exist"
          body="The link may be broken, or the page may have moved. Nothing in your drive has changed."
        >
          <Button render={<Link href="/" />}>Back to home</Button>
          <Button variant="secondary" render={<Link href="/dashboard" />}>
            Go to your drive
          </Button>
        </Notice>
      </main>
    </>
  );
}
