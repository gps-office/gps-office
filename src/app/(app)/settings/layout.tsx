import { requireAdmin } from "@/lib/auth";
import { SettingsTabs } from "./tabs";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Settings</h1>
      <SettingsTabs />
      {children}
    </div>
  );
}
