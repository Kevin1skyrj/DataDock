"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";

import { Notice } from "@/components/common/notice";
import { PageContainer } from "@/components/dashboard/page-container";
import { Button } from "@/components/ui/button";

/**
 * The application's error boundary.
 *
 * Scoped to the dashboard segment, which is the whole reason it is a separate
 * file from the root one: an `error.js` renders *inside* its parent layout, so
 * this replaces only the page. The sidebar, the top bar and the command palette
 * all survive — which means a failed screen is somewhere you can leave by
 * clicking, rather than a dead end that needs the back button.
 *
 * It renders into `PageContainer` for the same reason: the failure should look
 * like a page of the application that has nothing to show, not like the
 * application has been replaced by a message.
 */
export default function DashboardError({ error, reset }) {
  return (
    <PageContainer>
      <div className="flex flex-1 items-center justify-center py-10">
        <Notice
          icon={TriangleAlert}
          title="This page didn't load"
          body="Something went wrong while loading this screen. Your files are safe — nothing was changed."
          detail={error?.digest ? `Reference ${error.digest}` : null}
        >
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="secondary" render={<Link href="/dashboard" />}>
            Back to dashboard
          </Button>
        </Notice>
      </div>
    </PageContainer>
  );
}
