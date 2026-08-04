import { DashboardHome } from "@/app/dashboard/dashboard-home";
import { PageContainer } from "@/components/dashboard/page-container";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <PageContainer flush>
      <DashboardHome />
    </PageContainer>
  );
}
