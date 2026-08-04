import { Suspense } from "react";

import { SearchRoute } from "@/app/dashboard/search/search-route";
import { PageContainer } from "@/components/dashboard/page-container";

export const metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <PageContainer flush>
      <Suspense fallback={null}>
        <SearchRoute />
      </Suspense>
    </PageContainer>
  );
}
