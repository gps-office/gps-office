import { getCurrentStaff } from "@/lib/auth";
import { AppNav } from "@/components/app-nav";
import { signOut } from "../(auth)/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const staff = await getCurrentStaff();
  return (
    <div className="min-h-screen lg:flex">
      <AppNav staff={{ name: staff.full_name, role: staff.role }} signOut={signOut} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
