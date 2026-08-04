import { Suspense } from "react";

import { FilesRoute } from "@/app/dashboard/files/files-route";
import { PageContainer } from "@/components/dashboard/page-container";

export const metadata = { title: "All files" };

export default function FilesPage() {
  return (
    <PageContainer flush>
      {/* `useSearchParams` needs a boundary to prerender against. The fallback
          is deliberately nothing: the workspace opens on its own skeleton a
          frame later, and two loading states stacked on each other is worse
          than one arriving slightly late. */}
      <Suspense fallback={null}>
        <FilesRoute />
      </Suspense>
    </PageContainer>
  );
}
