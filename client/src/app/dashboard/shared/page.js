import { SharedRoute } from "@/app/dashboard/shared/shared-route";
import { PageContainer } from "@/components/dashboard/page-container";

export const metadata = { title: "Shared" };

export default function Page() {
  return (
    <PageContainer flush>
      <SharedRoute />
    </PageContainer>
  );
}
