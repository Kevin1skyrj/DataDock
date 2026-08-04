import { StorageRoute } from "@/app/dashboard/storage/storage-route";
import { PageContainer } from "@/components/dashboard/page-container";

export const metadata = { title: "Storage" };

export default function StoragePage() {
  return (
    <PageContainer flush>
      <StorageRoute />
    </PageContainer>
  );
}
