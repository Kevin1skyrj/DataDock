import { StarredRoute } from "@/app/dashboard/starred/starred-route";
import { PageContainer } from "@/components/dashboard/page-container";

export const metadata = { title: "Starred" };

export default function Page() {
  return (
    <PageContainer flush>
      <StarredRoute />
    </PageContainer>
  );
}
