import { SettingsNav } from "@/app/dashboard/settings/settings-nav";

export const metadata = {
  title: { default: "Settings", template: "%s · Settings · DataDock" },
};

/**
 * Every settings page renders through here.
 *
 * The width is capped well below the workspace's. A settings form is read left
 * to right one line at a time, and a label sixteen hundred pixels from its
 * control is a label nobody connects to it.
 */
export default function SettingsLayout({ children }) {
  return (
    <div className="min-h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 lg:flex-row lg:gap-10">
        <SettingsNav />
        <div className="flex min-w-0 flex-1 flex-col gap-6 pb-8">{children}</div>
      </div>
    </div>
  );
}
