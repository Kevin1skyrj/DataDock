import { PagePlaceholder } from "@/components/dashboard/page-placeholder";

export const metadata = { title: "Recent" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Recent"
      description="Everything you have opened or changed lately, newest first."
    />
  );
}
