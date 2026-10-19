import { getCurrentStaff } from "@/lib/auth";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const staff = await getCurrentStaff();
  return <PageHeader title={`Good day, ${staff.full_name}`} subtitle="Dashboard coming in step 6." />;
}
