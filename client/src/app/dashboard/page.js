import { PagePlaceholder } from "@/components/dashboard/page-placeholder";

export const metadata = { title: "Dashboard" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Dashboard Home"
      description="Your workspace overview lands here — storage, recent files, quick upload and activity."
    />
  );
}
