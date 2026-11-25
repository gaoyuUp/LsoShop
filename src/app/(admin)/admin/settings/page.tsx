import type { Metadata } from "next";
import { connection } from "next/server";
import {
  CircleCheck,
  CircleDashed,
  CloudCog,
  CreditCard,
  Database,
  Download,
  KeyRound,
  Mail,
  Megaphone,
  Save,
  Search,
  Send,
  ServerCog,
  ShieldCheck,
  Store,
  UploadCloud,
} from "lucide-react";
import { CopyButton } from "@/components/admin/copy-button";
import { ImageField } from "@/components/admin/image-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { changePasswordAction, saveMailSettingsAction, savePromoSettingsAction, saveSeoSettingsAction, saveSettingsAction, sendTestMailAction } from "@/lib/actions/settings";
import { getSettingsMap } from "@/lib/admin-data";
import { getSiteConfig, SITE_SETTING_KEYS } from "@/lib/site-config";
import { SupportChannelIcon } from "@/components/site/support-icons";
import { requireAdmin } from "@/lib/auth/admin";
import { env } from "@/lib/env";
import { getMailStatus } from "@/lib/mail/config";
import { isMockPayment } from "@/lib/payment";

export const metadata: Metadata = { title: "站点设置" };

export default async function AdminSettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  await connection();
  const admin = await requireAdmin();
  const sp = await searchParams;
  const saved = sp.saved === "1";
  const password = sp.password === "1";
  const promoSaved = sp.promoSaved === "1";
  const mailSaved = sp.mailSaved === "1";
  const seoSaved = sp.seoSaved === "1";
  const mailTest = typeof sp.mailTest === "string" ? sp.mailTest : "";
  const error = typeof sp.error === "string" ? sp.error : "";
  const [settings, mail, site] = await Promise.all([
    getSettingsMap([
      "announcement", "supportQQ", "supportWechat", "supportEmail", "supportTelegram",
      "promo_min_withdraw_cents", "promo_commission_rate", "promo_invite_ttl_days", "promo_max_price_codes",
      ...SITE_SETTING_KEYS,
    ]),
    getMailStatus(),
    getSiteConfig(),
  ]);
  const siteNameValue = settings.siteName || site.name;
  const siteSloganValue = settings.siteSlogan || site.slogan;
  const siteTaglineValue = settings.siteTagline || site.tagline;
  const siteLogoValue = settings.siteLogo ?? "";
  const siteIconValue = settings.siteIcon || site.iconUrl;
  const siteOgImageValue = settings.siteOgImage || site.ogImageUrl;
  const promoMin = (Number(settings.promo_min_withdraw_cents ?? "5000") || 5000) / 100;
  const promoRate = Number(settings.promo_commission_rate ?? "100") || 100;
  const promoTtl = Number(settings.promo_invite_ttl_days ?? "30") || 30;
  const promoMaxCodes = Number(settings.promo_max_price_codes ?? "10") || 10;

  const mailTestNotice =
    mailTest === "sent"
      ? { text: "测试邮件已发送成功，请检查收件箱（以及垃圾箱）", tone: "ok" as const }
      : mailTest === "failed"
        ? { text: "测试邮件发送失败，请检查服务器、端口与授权码，详细错误见「邮件」页", tone: "error" as const }
        : mailTest === "skipped"
          ? { text: "邮箱服务未启用或配置不完整，邮件仅记录未发送", tone: "warn" as const }
          : null;

  const services = [
    {
      label: "支付渠道",
      value: isMockPayment() ? "模拟支付（支付宝待接入）" : "支付宝",
      ok: !isMockPayment(),
      hint: isMockPayment() ? "PAYMENT_MODE=mock" : "PAYMENT_MODE=alipay",
      icon: CreditCard,
    },
    {
      label: "邮件服务",
      value: mail.enabled ? `SMTP · ${mail.host}` : mail.passwordSet ? "已填写，但未启用" : "未配置（仅记录）",
      ok: mail.enabled,
      hint: mail.enabled ? `${mail.user} · 真实发信已开启` : "可在下方「邮件服务」中配置",
      icon: Mail,
    },
    {
      label: "数据库",
      value: "MySQL · 已连接",
      ok: true,
      hint: "全链路 UTC 存储，北京时间展示",
      icon: Database,
    },
    {
      label: "图片存储",
      value: env.uploadDir,
      ok: true,
      hint: "随项目 storage 目录一起备份",
      icon: UploadCloud,
    },
  ];

  return (
    <div className="space-y-4">
      {saved && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400">
          站点设置已保存，前台已同步更新
        </div>
      )}
      {seoSaved && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400">
          品牌与 SEO 设置已保存，前台已同步更新
        </div>
      )}
      {password && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400">
          密码已更新，下次登录请使用新密码
        </div>
      )}
      {mailSaved && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400">
          邮件服务配置已保存，新的配置立即生效
        </div>
      )}
      {mailTestNotice && (
        <div
          className={
            mailTestNotice.tone === "ok"
              ? "rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400"
              : mailTestNotice.tone === "error"
                ? "rounded-xl border border-rose-500/20 bg-rose-500/[0.07] px-4 py-3 text-xs text-rose-600 dark:text-rose-400"
                : "rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3 text-xs text-amber-600 dark:text-amber-400"
          }
        >
          {mailTestNotice.text}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.07] px-4 py-3 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <section id="seo" className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 backdrop-blur sm:p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-brand/10 text-brand">
                <Search className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">品牌与 SEO</h3>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  站点名称、副标题、Logo、浏览器图标与分享图；留空的图片会使用当前默认样式。
                </p>
              </div>
            </div>

            <form action={saveSeoSettingsAction} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium">
                    站点名称 <span className="text-rose-500">*</span>
                  </span>
                  <input
                    name="siteName"
                    required
                    maxLength={40}
                    defaultValue={siteNameValue}
                    placeholder="灵搜小店"
                    className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 text-xs outline-none transition placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                  />
                  <span className="mt-1 block text-[12px] text-muted-foreground">用于浏览器标题、Logo 旁名称和邮件署名</span>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium">
                    站点副标题 <span className="text-rose-500">*</span>
                  </span>
                  <input
                    name="siteSlogan"
                    required
                    maxLength={60}
                    defaultValue={siteSloganValue}
                    placeholder="精选 AI 账号与订阅服务"
                    className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 text-xs outline-none transition placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                  />
                  <span className="mt-1 block text-[12px] text-muted-foreground">显示在站点名称后，例如「灵搜小店 · 精选 AI 账号与订阅服务」</span>
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-medium">补充说明</span>
                  <input
                    name="siteTagline"
                    maxLength={120}
                    defaultValue={siteTaglineValue}
                    placeholder="付款即发货 · 交付内容随时可查"
                    className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 text-xs outline-none transition placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                  />
                  <span className="mt-1 block text-[12px] text-muted-foreground">用于自动组合 SEO 描述；SEO 描述留空时生效</span>
                </label>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <span className="mb-2 block text-xs font-medium">站点 Logo</span>
                  <ImageField
                    name="siteLogo"
                    defaultValue={siteLogoValue}
                    defaultPreviewUrl="/logo.png"
                    defaultPreviewLabel="默认 Logo"
                    previewClassName="aspect-square w-full sm:w-28"
                    imageClassName="size-full object-contain p-2"
                    uploadLabel="上传 Logo"
                    hint="建议上传 1:1 图片；留空使用内置矢量 Logo（自动适配日夜间）。"
                    presets={[]}
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">展示位置</span>
                    {["顶部导航", "首页主视觉", "页脚", "开通页", "管理后台", "推广卡片"].map((position) => (
                      <span key={position} className="rounded-full border border-foreground/10 px-2 py-0.5 text-[10px] text-muted-foreground">
                        {position}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="mb-2 block text-xs font-medium">站点图标</span>
                  <ImageField
                    name="siteIcon"
                    defaultValue={siteIconValue}
                    previewClassName="aspect-square w-full sm:w-28"
                    imageClassName="size-full object-contain p-3"
                    uploadLabel="上传图标"
                    hint="浏览器标签页图标，建议 1:1，支持 PNG / SVG / ICO。"
                    presets={[]}
                    accept="image/*,.ico"
                  />
                </div>
              </div>

              <div>
                <span className="mb-2 block text-xs font-medium">社交分享图</span>
                <ImageField
                  name="siteOgImage"
                  defaultValue={siteOgImageValue}
                  previewClassName="aspect-video w-full sm:w-56"
                  uploadLabel="上传分享图"
                  hint="用于微信、社交平台和搜索引擎的分享预览，建议尺寸 1200×630。"
                  presets={[]}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-medium">SEO 描述</span>
                  <textarea
                    name="seoDescription"
                    rows={2}
                    maxLength={200}
                    defaultValue={settings.seoDescription ?? ""}
                    placeholder={site.description}
                    className="w-full resize-y rounded-xl border border-foreground/10 bg-background px-3 py-2.5 text-xs leading-relaxed outline-none transition placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                  />
                  <span className="mt-1 block text-[12px] text-muted-foreground">留空时自动使用「副标题，补充说明」</span>
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-medium">SEO 关键词</span>
                  <input
                    name="seoKeywords"
                    maxLength={300}
                    defaultValue={settings.seoKeywords ?? ""}
                    placeholder={site.keywords.join("，")}
                    className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 text-xs outline-none transition placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                  />
                  <span className="mt-1 block text-[12px] text-muted-foreground">多个关键词用逗号分隔；留空使用默认关键词</span>
                </label>
              </div>

              <div className="flex justify-end">
                <SubmitButton pendingText="保存中…">
                  <Save className="mr-1 size-3.5" />
                  保存品牌与 SEO
                </SubmitButton>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 backdrop-blur sm:p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-brand/10 text-brand">
                <Store className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">站点内容</h3>
                <p className="mt-0.5 text-[13px] text-muted-foreground">公告显示在首页顶部；联系支持显示在订单详情页底部，点击后弹窗展示已填写的渠道</p>
              </div>
            </div>

            <form action={saveSettingsAction} className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium">
                  <Megaphone className="size-3.5 text-muted-foreground" />
                  首页公告
                </span>
                <textarea
                  name="announcement"
                  defaultValue={settings.announcement ?? ""}
                  rows={3}
                  maxLength={300}
                  placeholder="例如：付款后自动发货，交付内容可在「我的订单」中查看"
                  className="w-full resize-y rounded-xl border border-foreground/10 bg-background px-3 py-2.5 text-xs leading-relaxed outline-none transition placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                />
                <span className="mt-1 block text-[12px] text-muted-foreground">留空则不在首页展示公告条</span>
              </label>

              <div className="border-t border-foreground/[0.06] pt-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold">联系支持</span>
                  <span className="text-[11px] text-muted-foreground">只填需要的渠道，未填写的不会出现在前台</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium">
                      <SupportChannelIcon channel="qq" className="size-3.5 text-[#12b7f5]" />
                      QQ
                    </span>
                    <input
                      name="supportQQ"
                      defaultValue={settings.supportQQ ?? ""}
                      maxLength={120}
                      placeholder="QQ 号"
                      className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 font-mono text-xs outline-none transition placeholder:font-sans placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium">
                      <SupportChannelIcon channel="wechat" className="size-3.5 text-[#07c160]" />
                      微信
                    </span>
                    <input
                      name="supportWechat"
                      defaultValue={settings.supportWechat ?? ""}
                      maxLength={120}
                      placeholder="微信号"
                      className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 font-mono text-xs outline-none transition placeholder:font-sans placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium">
                      <SupportChannelIcon channel="email" className="size-3.5 text-brand" />
                      邮箱
                    </span>
                    <input
                      name="supportEmail"
                      type="email"
                      defaultValue={settings.supportEmail ?? ""}
                      maxLength={191}
                      placeholder="support@example.com"
                      className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 text-xs outline-none transition placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium">
                      <SupportChannelIcon channel="telegram" className="size-3.5 text-[#229ed9]" />
                      Telegram
                    </span>
                    <input
                      name="supportTelegram"
                      defaultValue={settings.supportTelegram ?? ""}
                      maxLength={191}
                      placeholder="@username 或 t.me 链接"
                      className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 font-mono text-xs outline-none transition placeholder:font-sans placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <SubmitButton pendingText="保存中…">
                  <Save className="mr-1 size-3.5" />
                  保存设置
                </SubmitButton>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 backdrop-blur sm:p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Mail className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">邮件服务</h3>
                  <span
                    className={
                      mail.enabled
                        ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                        : "rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400"
                    }
                  >
                    {mail.enabled ? "真实发信中" : "未启用"}
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  交付邮件通过这里的 SMTP 发送。换邮箱或授权码后，在后台保存即可，无需改代码重启。
                </p>
              </div>
            </div>

            <form action={saveMailSettingsAction} className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-medium">SMTP 服务器</span>
                  <input
                    name="mailHost"
                    defaultValue={mail.host}
                    maxLength={191}
                    placeholder="smtp.qiye.aliyun.com"
                    className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 font-mono text-xs outline-none transition placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium">端口</span>
                  <input
                    name="mailPort"
                    type="number"
                    min={1}
                    max={65535}
                    defaultValue={mail.port}
                    className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 font-mono text-xs outline-none transition focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium">加密方式</span>
                  <select
                    name="mailSecure"
                    defaultValue={mail.secure ? "1" : "0"}
                    className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-2.5 text-xs outline-none transition focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                  >
                    <option value="1">SSL / TLS（常用 465）</option>
                    <option value="0">STARTTLS（常用 587）</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium">发件邮箱（SMTP 账号）</span>
                  <input
                    name="mailUser"
                    type="email"
                    defaultValue={mail.user}
                    maxLength={191}
                    placeholder="postmaster@example.com"
                    className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 text-xs outline-none transition placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium">授权码 / 密码</span>
                  <input
                    name="mailPass"
                    type="password"
                    autoComplete="new-password"
                    maxLength={200}
                    placeholder={mail.passwordSet ? "已配置，留空则保持不变" : "请输入 SMTP 授权码"}
                    className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 text-xs outline-none transition placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-medium">发件人显示</span>
                  <input
                    name="mailFrom"
                    defaultValue={mail.from}
                    maxLength={255}
                    placeholder={`${site.name} <postmaster@example.com>`}
                    className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 text-xs outline-none transition placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" name="mailEnabled" value="1" defaultChecked={mail.enabled} className="size-3.5 accent-emerald-500" />
                  启用真实发信
                  <span className="text-[11px] text-muted-foreground/60">关闭后邮件只记录不发送</span>
                </label>
                <SubmitButton pendingText="保存中…">
                  <Save className="mr-1 size-3.5" />
                  保存邮件配置
                </SubmitButton>
              </div>
            </form>

            <div className="mt-4 border-t border-foreground/[0.06] pt-3">
              <form action={sendTestMailAction} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    name="to"
                    type="email"
                    defaultValue={mail.user}
                    maxLength={191}
                    placeholder="测试收件邮箱"
                    className="h-9 w-full rounded-lg border border-foreground/10 bg-background pl-9 pr-3 text-xs outline-none transition placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                  />
                </div>
                <SubmitButton variant="outline" pendingText="发送中…" className="h-9 shrink-0">
                  <Send className="mr-1 size-3.5" />
                  发送测试邮件
                </SubmitButton>
              </form>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                请先保存配置再测试。授权码会加密保存在数据库，导出数据库时不会以明文出现；更换 <code className="rounded bg-foreground/[0.06] px-1 font-mono">AUTH_SECRET</code> 后需要重新填写。
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 backdrop-blur sm:p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <CloudCog className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">部署与备份</h3>
                <p className="mt-0.5 text-[13px] text-muted-foreground">上线时只需迁移数据库、上传代码与配置环境变量</p>
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              {[
                { title: "导出数据库（本地 / 线上）", cmd: "pnpm db:export", desc: "生成 backups/lsoshop-日期.sql，可直接导入线上 MySQL" },
                { title: "初始化 / 升级数据库", cmd: "pnpm db:setup", desc: "自动建库、执行迁移并创建管理员与初始商品" },
                { title: "生产构建与启动", cmd: "pnpm build && pnpm start", desc: "Next.js standalone 输出，适合 Node 服务器部署" },
              ].map((item) => (
                <div key={item.cmd} className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.015] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-medium">{item.title}</span>
                    <div className="flex items-center gap-1">
                      <code className="rounded bg-foreground/[0.06] px-2 py-1 font-mono text-[12px]">{item.cmd}</code>
                      <CopyButton text={item.cmd} />
                    </div>
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] px-3 py-2.5 text-[12px] leading-relaxed text-amber-700 dark:text-amber-300">
              <UploadCloud className="mt-0.5 size-3.5 shrink-0" />
              <p>
                商品图片保存在 <code className="rounded bg-amber-500/10 px-1 font-mono">{env.uploadDir}</code>
                ，备份数据库时请一并备份该目录，避免线上图片丢失。环境变量请从本地 <code className="rounded bg-amber-500/10 px-1 font-mono">.env.local</code> 迁移到线上。
              </p>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ServerCog className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">服务状态</h3>
                <p className="mt-0.5 text-[13px] text-muted-foreground">当前运行环境概览</p>
              </div>
            </div>
            <ul className="mt-3 divide-y divide-foreground/[0.05]">
              {services.map((s) => (
                <li key={s.label} className="flex items-start gap-2.5 py-3 first:pt-1 last:pb-1">
                  <s.icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium">
                      {s.label}
                      {s.ok ? (
                        <CircleCheck className="size-3 text-emerald-500" />
                      ) : (
                        <CircleDashed className="size-3 text-amber-500" />
                      )}
                    </div>
                    <div className="mt-0.5 break-all font-mono text-[12px] text-muted-foreground">{s.value}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground/70">{s.hint}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CreditCard className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">代理推广设置</h3>
                <p className="mt-0.5 text-[13px] text-muted-foreground">最低提现、佣金比例和邀请码有效期；保存后立即生效。</p>
              </div>
            </div>
            {promoSaved && <p className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-600 dark:text-emerald-400">推广设置已保存</p>}
            <form action={savePromoSettingsAction} className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-4">
                <label className="block"><span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">最低提现（元）</span><input name="promoMinWithdraw" type="number" min="0" step="0.01" defaultValue={promoMin.toFixed(2)} className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 font-mono text-xs outline-none" /></label>
                <label className="block"><span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">佣金比例（%）</span><input name="promoCommissionRate" type="number" min="0" max="100" step="1" defaultValue={promoRate} className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 font-mono text-xs outline-none" /></label>
                <label className="block"><span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">邀请码有效期（天）</span><input name="promoInviteTtlDays" type="number" min="1" max="365" step="1" defaultValue={promoTtl} className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 font-mono text-xs outline-none" /></label>
                <label className="block"><span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">每位代理价位码上限</span><input name="promoMaxPriceCodes" type="number" min="1" max="50" step="1" defaultValue={promoMaxCodes} className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 font-mono text-xs outline-none" /></label>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">当前规则：每单利润按 {promoRate}% 返佣；客户首绑永久；代理自购不计佣金；一期仅人民币。</p>
              <div className="flex justify-end"><SubmitButton pendingText="保存中…">保存推广设置</SubmitButton></div>
            </form>
          </section>

          <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <KeyRound className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">账号安全</h3>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  当前管理员 <span className="font-mono text-foreground">{admin.username}</span>
                </p>
              </div>
            </div>
            <form action={changePasswordAction} className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">当前密码</span>
                <input
                  name="current"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 text-xs outline-none transition focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">新密码</span>
                  <input
                    name="next"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    placeholder="至少 8 位"
                    className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 text-xs outline-none transition placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">确认新密码</span>
                  <input
                    name="confirm"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 text-xs outline-none transition focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                  />
                </label>
              </div>
              <div className="flex justify-end">
                <SubmitButton variant="outline" pendingText="更新中…">
                  <ShieldCheck className="mr-1 size-3.5" />
                  更新密码
                </SubmitButton>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 text-[12px] leading-relaxed text-muted-foreground backdrop-blur">
            <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
              <Download className="size-3.5" />
              备份建议
            </div>
            <p className="mt-2">
              每周执行一次 <code className="rounded bg-foreground/[0.06] px-1 font-mono">pnpm db:export</code>
              ，并备份 <code className="rounded bg-foreground/[0.06] px-1 font-mono">storage/</code>
              目录与 <code className="rounded bg-foreground/[0.06] px-1 font-mono">.env.local</code>
              。导出的 SQL 文件包含商品、规格、库存、订单与邮件记录。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
