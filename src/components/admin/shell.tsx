"use client";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  Boxes,
  ChevronRight,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShoppingBag,
  Sparkles,
  Tags,
  Store,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { AdminPageTransition } from "./page-transition";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";

const NAV = [
  { href: "/admin", label: "总览", caption: "今日经营概况", icon: LayoutDashboard },
  { href: "/admin/products", label: "商品", caption: "商品、规格与须知", icon: Package },
  { href: "/admin/categories", label: "分类", caption: "商品分类管理", icon: Tags },
  { href: "/admin/inventory", label: "库存", caption: "卡密与交付内容", icon: Boxes },
  { href: "/admin/orders", label: "订单", caption: "支付与发货", icon: ShoppingBag },
  { href: "/admin/agents", label: "代理", caption: "邀请码、代理与提现", icon: UsersRound },
  { href: "/admin/withdrawals", label: "提现", caption: "人工打款处理", icon: Wallet },
  { href: "/admin/emails", label: "邮件", caption: "发送记录与预览", icon: Mail },
  { href: "/admin/settings", label: "设置", caption: "站点与账号安全", icon: Settings },
] as const;

const TEST_INBOX = { href: "/admin/dev/codes", label: "测试验证码", caption: "代理邮箱验证码测试", icon: Inbox } as const;

function pageTitle(pathname: string) {
  if (pathname === "/admin") return { title: "总览", desc: "今天的生意，一眼看清" };
  if (pathname === "/admin/products/new") return { title: "新建商品", desc: "创建商品后即可添加规格" };
  if (pathname.startsWith("/admin/products/")) return { title: "编辑商品", desc: "修改商品信息、规格与购买须知" };
  if (pathname.startsWith("/admin/products")) return { title: "商品管理", desc: "管理在售商品、规格与展示" };
  if (pathname.startsWith("/admin/categories")) return { title: "分类管理", desc: "管理商品分类与归属" };
  if (pathname.startsWith("/admin/agents/")) return { title: "代理详情", desc: "客户、订单、佣金与提现" };
  if (pathname.startsWith("/admin/agents")) return { title: "代理管理", desc: "邀请码、代理账号与推广数据" };
  if (pathname.startsWith("/admin/withdrawals")) return { title: "提现管理", desc: "审核与人工打款" };
  if (pathname.startsWith("/admin/inventory")) return { title: "库存管理", desc: "批量导入卡密与交付内容" };
  if (pathname.startsWith("/admin/orders/")) return { title: "订单详情", desc: "查看支付、发货与邮件记录" };
  if (pathname.startsWith("/admin/orders")) return { title: "订单管理", desc: "筛选、确认与发货" };
  if (pathname.startsWith("/admin/emails")) return { title: "邮件记录", desc: "所有交付邮件的发送状态" };
  if (pathname.startsWith("/admin/settings")) return { title: "站点设置", desc: "公告、联系方式与账号安全" };
  if (pathname.startsWith("/admin/dev/codes")) return { title: "验证码收件箱", desc: "测试阶段读取代理邮箱验证码" };
  return { title: "管理后台", desc: "" };
}

export function AdminShell({
  username,
  defaultCollapsed = false,
  showTestInbox = false,
  children,
}: {
  username: string;
  defaultCollapsed?: boolean;
  showTestInbox?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `lso_admin_collapsed=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  }
  const meta = pageTitle(pathname);
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));
  const current =
    [...NAV, ...(showTestInbox ? [TEST_INBOX] : [])].find((n) => isActive(n.href)) ?? NAV[0];

  return (
    <div className="admin-scope relative min-h-dvh">
      {/* 背景 */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[#f6f6f8] dark:bg-[#0b0b0f]" />
        <div className="absolute -left-40 -top-40 size-[32rem] rounded-full bg-brand/[0.07] blur-[110px] dark:bg-brand/[0.12]" />
        <div className="absolute -bottom-40 right-0 size-[30rem] rounded-full bg-brand-2/[0.06] blur-[110px] dark:bg-brand-2/[0.09]" />
        <div
          className="absolute inset-0 opacity-60 dark:opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in oklch, currentColor 3%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, currentColor 3%, transparent) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 70% 50% at 40% 0%, #000, transparent 80%)",
          }}
        />
      </div>

      {/* 桌面侧栏 */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-foreground/[0.06] bg-background/70 backdrop-blur-2xl transition-[width] duration-300 ease-out lg:flex",
          collapsed ? "w-[76px]" : "w-60",
        )}
      >
        <Link
          href="/admin"
          title="灵搜小店"
          className={cn(
            "flex items-center transition-all",
            collapsed ? "justify-center px-0 pb-5 pt-6" : "gap-3 px-5 pb-5 pt-6",
          )}
        >
          <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-foreground text-background shadow-sm">
            <LogoMark className="size-6" />
          </span>
          {!collapsed && (
            <span>
              <span className="block text-sm font-semibold leading-tight tracking-tight">灵搜小店</span>
              <span className="mt-0.5 block text-[12px] uppercase tracking-[0.16em] text-muted-foreground">Console</span>
            </span>
          )}
        </Link>

        <nav className={cn("flex-1 space-y-1 overflow-y-auto", collapsed ? "px-2" : "px-3")}>
          {!collapsed && (
            <p className="px-3 pb-2 pt-3 text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">Workspace</p>
          )}
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
                className={cn(
                  "group relative flex items-center rounded-xl text-sm transition-colors",
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5",
                  active ? "text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="admin-nav-active"
                    className="absolute inset-0 -z-10 rounded-xl border border-foreground/[0.07] bg-background shadow-sm"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                )}
                <item.icon className={cn("size-[19px] shrink-0", active && "text-brand")} />
                {!collapsed && (
                  <>
                    <span className="flex-1 font-medium">{item.label}</span>
                    {active ? (
                      <span className="size-1.5 rounded-full bg-brand" />
                    ) : (
                      <ChevronRight className="size-3.5 opacity-0 transition group-hover:opacity-40" />
                    )}
                  </>
                )}
              </Link>
            );
          })}

          <div className={cn("my-4 h-px bg-foreground/[0.06]", collapsed && "mx-1")} />
          <Link
            href="/"
            target="_blank"
            title={collapsed ? "前台商店" : undefined}
            className={cn(
              "group flex items-center rounded-xl text-sm text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground",
              collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5",
            )}
          >
            <Store className="size-[19px]" />
            {!collapsed && (
              <>
                <span className="flex-1 font-medium">前台商店</span>
                <ArrowUpRight className="size-3.5 opacity-40 transition group-hover:opacity-80" />
              </>
            )}
          </Link>
          {showTestInbox && (
            <Link
              href={TEST_INBOX.href}
              title={collapsed ? "测试验证码" : undefined}
              className={cn(
                "group flex items-center rounded-xl text-sm text-muted-foreground transition-colors hover:bg-amber-500/[0.06] hover:text-foreground",
                collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5",
              )}
            >
              <Inbox className="size-[19px] text-amber-600 dark:text-amber-400" />
              {!collapsed && (
                <>
                  <span className="flex-1 font-medium">测试验证码</span>
                  <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:text-amber-300">TEST</span>
                </>
              )}
            </Link>
          )}
        </nav>

        <div className="p-3">
          {collapsed ? (
            <div className="flex flex-col items-center gap-1 rounded-2xl border border-foreground/[0.06] bg-foreground/[0.02] p-2">
              <span
                title={username}
                className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-xs font-semibold uppercase text-white"
              >
                {username.slice(0, 1)}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  title="退出登录"
                  aria-label="退出登录"
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-500"
                >
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-2xl border border-foreground/[0.06] bg-foreground/[0.02] p-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-xs font-semibold uppercase text-white">
                  {username.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">{username}</div>
                  <div className="text-[12px] text-muted-foreground">管理员</div>
                </div>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    title="退出登录"
                    className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-500"
                  >
                    <LogOut className="size-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 移动端抽屉 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-foreground/10 bg-background p-3 shadow-2xl"
            >
              <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-[10px] bg-foreground text-background">
                    <LogoMark className="size-5" />
                  </span>
                  <span className="text-sm font-semibold">灵搜小店</span>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-lg hover:bg-foreground/[0.06]">
                  <X className="size-4" />
                </button>
              </div>
              <nav className="mt-2 flex-1 space-y-1 overflow-y-auto">
                {NAV.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-sm",
                        active ? "bg-foreground/[0.06] font-medium" : "text-muted-foreground",
                      )}
                    >
                      <item.icon className={cn("size-[18px]", active && "text-brand")} />
                      {item.label}
                    </Link>
                  );
                })}
                <Link href="/" target="_blank" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground">
                  <Store className="size-[18px]" />
                  前台商店
                  <ArrowUpRight className="ml-auto size-3.5" />
                </Link>
                {showTestInbox && (
                  <Link href={TEST_INBOX.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground">
                    <Inbox className="size-[18px] text-amber-600 dark:text-amber-400" />
                    测试验证码
                    <span className="ml-auto rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:text-amber-300">TEST</span>
                  </Link>
                )}
              </nav>
              <div className="flex items-center justify-between rounded-xl border border-foreground/[0.07] p-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-[13px] font-semibold uppercase text-white">
                    {username.slice(0, 1)}
                  </span>
                  <span className="text-xs font-medium">{username}</span>
                </div>
                <form action={logoutAction}>
                  <button type="submit" className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:text-rose-500">
                    <LogOut className="size-4" />
                  </button>
                </form>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主区域 */}
      <div className={cn("transition-[padding] duration-300 ease-out", collapsed ? "lg:pl-[76px]" : "lg:pl-60")}>
        <header className="sticky top-0 z-30 border-b border-foreground/[0.05] bg-background/60 backdrop-blur-xl">
          <div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6 lg:px-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid size-9 place-items-center rounded-lg border border-foreground/10 lg:hidden"
              aria-label="打开菜单"
            >
              <Menu className="size-4" />
            </button>
            <button
              type="button"
              onClick={toggleCollapsed}
              title={collapsed ? "展开菜单" : "收起菜单"}
              aria-label={collapsed ? "展开菜单" : "收起菜单"}
              className="hidden size-9 place-items-center rounded-lg border border-foreground/10 text-muted-foreground transition hover:border-foreground/25 hover:text-foreground lg:grid"
            >
              {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-semibold tracking-tight">{meta.title}</h1>
                {current.label !== meta.title && (
                  <span className="hidden items-center gap-1 rounded-full bg-foreground/[0.04] px-2 py-0.5 text-[12px] text-muted-foreground sm:inline-flex">
                    <Sparkles className="size-2.5" />
                    {current.label}
                  </span>
                )}
              </div>
              <p className="hidden truncate text-[13px] text-muted-foreground sm:block">{meta.desc}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Link
                href="/"
                target="_blank"
                className="hidden h-9 items-center gap-1.5 rounded-full border border-foreground/10 px-3.5 text-xs text-muted-foreground transition hover:border-foreground/25 hover:text-foreground sm:inline-flex"
              >
                <Store className="size-3.5" />
                查看店铺
                <ArrowUpRight className="size-3" />
              </Link>
              <ThemeToggle />
              <span className="ml-1 grid size-8 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-xs font-semibold uppercase text-white">
                {username.slice(0, 1)}
              </span>
            </div>
          </div>
          <span key={pathname} aria-hidden className="admin-route-beam" />
        </header>

        <main className="w-full px-4 pb-16 pt-6 sm:px-6 lg:px-6">
          <AdminPageTransition>{children}</AdminPageTransition>
        </main>
      </div>
    </div>
  );
}
