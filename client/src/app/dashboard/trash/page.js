import { PagePlaceholder } from "@/components/dashboard/page-placeholder";

export const metadata = { title: "Trash" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Trash"
      description="Deleted files, restorable until they are purged."
    />
  );
}
