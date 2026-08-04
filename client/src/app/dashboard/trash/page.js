import { TrashRoute } from "@/app/dashboard/trash/trash-route";
import { PageContainer } from "@/components/dashboard/page-container";

export const metadata = { title: "Trash" };

export default function Page() {
  return (
    <PageContainer flush>
      <TrashRoute />
    </PageContainer>
  );
}
