import type { Metadata } from "next";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminShell } from "@/components/admin/shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const [admin, store] = await Promise.all([requireAdmin(), cookies()]);
  const collapsed = store.get("lso_admin_collapsed")?.value === "1";
  const showTestInbox = process.env.NODE_ENV !== "production" || process.env.ALLOW_TEST_CODE_INBOX === "1";
  return (
    <AdminShell username={admin.username} defaultCollapsed={collapsed} showTestInbox={showTestInbox}>
      {children}
    </AdminShell>
  );
}
