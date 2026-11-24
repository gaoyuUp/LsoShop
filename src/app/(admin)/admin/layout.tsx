import type { Metadata } from "next";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminShell } from "@/components/admin/shell";
import { getSiteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const [admin, store, site] = await Promise.all([requireAdmin(), cookies(), getSiteConfig()]);
  const collapsed = store.get("lso_admin_collapsed")?.value === "1";
  const showTestInbox = process.env.NODE_ENV !== "production" || process.env.ALLOW_TEST_CODE_INBOX === "1";
  return (
    <AdminShell username={admin.username} defaultCollapsed={collapsed} showTestInbox={showTestInbox} siteName={site.name} logoUrl={site.logoUrl}>
      {children}
    </AdminShell>
  );
}
