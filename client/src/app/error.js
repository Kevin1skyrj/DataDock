"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";

import { Notice } from "@/components/common/notice";
import { PageAtmosphere } from "@/components/common/page-atmosphere";
import { Button } from "@/components/ui/button";

/**
 * The public error boundary.
 *
 * Catches anything thrown while rendering the marketing and authentication
 * routes. It must be a Client Component — a boundary that recovers needs state,
 * and `reset` is a function it hands back to the button.
 *
 * `reset` re-renders the segment rather than reloading the document, so a
 * transient failure costs a click instead of a full page load. It is offered
 * first because it is very often enough.
 *
 * The message says the drive is untouched. That is not reassurance for its own
 * sake — a render error on the pricing page genuinely cannot have altered
 * anyone's files, and the person reading this does not know that.
 */
export default function RootError({ error, reset }) {
  return (
    <>
      <PageAtmosphere />

      <main className="flex min-h-dvh items-center justify-center px-5 py-16">
        <Notice
          icon={TriangleAlert}
          title="Something went wrong"
          body="An unexpected error interrupted this page. Your account and your files are untouched."
          // Present only on production builds, where the real message has been
          // stripped. It is the only thing that ties this screen to a server log.
          detail={error?.digest ? `Reference ${error.digest}` : null}
        >
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="secondary" render={<Link href="/" />}>
            Back to home
          </Button>
        </Notice>
      </main>
    </>
  );
}
