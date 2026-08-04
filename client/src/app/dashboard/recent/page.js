import { RecentRoute } from "@/app/dashboard/recent/recent-route";
import { PageContainer } from "@/components/dashboard/page-container";

export const metadata = { title: "Recent" };

export default function Page() {
  return (
    <PageContainer flush>
      <RecentRoute />
    </PageContainer>
  );
}
