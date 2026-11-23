import { AtSign, BadgeCheck, CheckCircle2, CircleUserRound, MessageCircle, QrCode, Send } from "lucide-react";
import { CopyButton } from "@/components/agent/copy-button";
import { LogoMark } from "@/components/site/logo";
import { AgentField, AgentIconInput } from "@/components/agent/form-ui";
import { AgentQrUpload } from "@/components/agent/qr-upload";
import { saveAgentContactAction } from "@/lib/actions/agent";
import { requireAffiliate } from "@/lib/auth/affiliate-server";

function ContactRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof MessageCircle;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white/75 p-3 shadow-[0_8px_20px_-20px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/[0.08] dark:bg-white/[0.06]">
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-muted-foreground">{label}</div>
        <div className="mt-0.5 truncate text-[12px] font-medium">{value}</div>
      </div>
      <CopyButton value={value} label="" className="grid size-8 shrink-0 place-items-center rounded-lg border border-black/[0.06] text-muted-foreground transition hover:border-brand/30 hover:text-brand dark:border-white/[0.1]" />
    </div>
  );
}

export default async function AgentContactPage({ searchParams }: PageProps<"/promote/contact">) {
  const agent = await requireAffiliate();
  const sp = await searchParams;
  const hasContact = Boolean(agent.wechat || agent.wechatQr || agent.qq || agent.telegram);

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Contact</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">联系方式</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">这里的资料只展示在你的代理链接，平台客服仍独立管理。保存至少一种联系方式后，概览「设置客服联系方式」才会打勾；昵称不算客服渠道。</p>
      </div>

      {sp.saved === "1" && <p className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="size-3.5" /> 联系方式已保存，概览第一步已自动完成</p>}
      {!hasContact && <p className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2 text-[12px] text-amber-700 dark:text-amber-300">当前还没有代理客服渠道。填写微信、QQ、Telegram 任意一项或上传二维码后保存；只填展示名不会完成这一步。</p>}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <form action={saveAgentContactAction} className="rounded-[26px] border border-black/[0.06] bg-white p-5 shadow-[0_18px_50px_-40px_rgba(0,0,0,0.4)] dark:border-white/[0.08] dark:bg-white/[0.04] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold"><CircleUserRound className="size-4 text-brand" /> 我的客服资料</div>
              <p className="mt-1 text-[11px] text-muted-foreground">这些信息只出现在你的代理链接和代理商品页。</p>
            </div>
            <span className="rounded-full bg-black/[0.04] px-2.5 py-1 font-mono text-[10px] text-muted-foreground dark:bg-white/[0.06]">{agent.code}</span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <AgentField label="代理展示名" className="sm:col-span-2" hint="排行榜和店铺展示用，不填则默认使用邮箱前缀。">
              <AgentIconInput icon={CircleUserRound} name="nickname" defaultValue={agent.nickname} maxLength={60} placeholder="例如：小高好价" />
            </AgentField>
            <AgentField label="微信号">
              <AgentIconInput icon={MessageCircle} name="wechat" defaultValue={agent.wechat} maxLength={120} placeholder="输入微信号" />
            </AgentField>
            <AgentField label="QQ">
              <AgentIconInput icon={AtSign} name="qq" defaultValue={agent.qq} maxLength={120} placeholder="输入 QQ 号" />
            </AgentField>
            <AgentField label="Telegram" className="sm:col-span-2" hint="支持 @username 或完整链接。">
              <AgentIconInput icon={Send} name="telegram" defaultValue={agent.telegram} maxLength={191} placeholder="@username 或完整链接" />
            </AgentField>
            <div className="sm:col-span-2"><AgentQrUpload name="wechatQr" defaultValue={agent.wechatQr} /></div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.05] pt-4 dark:border-white/[0.06]">
            <p className="text-[10px] leading-relaxed text-muted-foreground">保存后立即更新客服菜单和代理链接。</p>
            <button type="submit" className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-foreground px-6 text-[12px] font-medium text-background transition hover:opacity-90 active:scale-[0.99]">
              保存联系方式
            </button>
          </div>
        </form>

        <aside className="space-y-2 lg:sticky lg:top-24">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-muted-foreground">买家看到的客服</span>
            <span className={hasContact ? "inline-flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400" : "inline-flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400"}>
              <span className={`size-1.5 rounded-full ${hasContact ? "bg-emerald-500" : "bg-amber-500"}`} />
              {hasContact ? "可联系" : "待完善"}
            </span>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-black/[0.07] bg-gradient-to-br from-white via-white to-brand/[0.04] p-5 shadow-[0_22px_55px_-38px_rgba(50,30,120,0.5)] dark:border-white/[0.1] dark:from-white/[0.06] dark:via-white/[0.035] dark:to-brand/[0.08] sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-brand/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-12 size-40 rounded-full bg-brand-2/10 blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 text-white shadow-[0_10px_26px_-14px_var(--brand)]">
                    <LogoMark className="size-7" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[14px] font-semibold tracking-tight">
                      <span className="truncate">{agent.nickname || agent.email.split("@")[0]}</span>
                      <BadgeCheck className="size-3.5 shrink-0 text-brand" />
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-muted-foreground">代理客服 · {agent.code}</div>
                  </div>
                </div>
                <span className="rounded-full border border-brand/15 bg-brand/[0.07] px-2.5 py-1 text-[9px] font-medium text-brand">专属客服</span>
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                {hasContact ? "购买前后有任何问题，可以直接通过以下方式联系我。" : "还没有填写联系方式，填写后这里会生成一张客服名片。"}
              </p>

              {hasContact ? (
                <div className="mt-4 space-y-2">
                  {agent.wechat && <ContactRow icon={MessageCircle} label="微信" value={agent.wechat} tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />}
                  {agent.qq && <ContactRow icon={AtSign} label="QQ" value={agent.qq} tone="bg-sky-500/10 text-sky-600 dark:text-sky-400" />}
                  {agent.telegram && <ContactRow icon={Send} label="Telegram" value={agent.telegram} tone="bg-[#229ed9]/10 text-[#229ed9]" />}
                  {agent.wechatQr && (
                    <div className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white/80 p-3 dark:border-white/[0.08] dark:bg-white/[0.08]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={agent.wechatQr} alt="微信二维码" className="size-20 shrink-0 rounded-xl border border-black/[0.06] bg-white object-cover dark:border-white/[0.1]" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium"><QrCode className="size-3.5 text-emerald-500" /> 微信二维码</div>
                        <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">扫码添加代理客服</p>
                        <CopyButton value={agent.wechatQr} label="复制链接" className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground transition hover:text-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-black/[0.1] bg-white/40 px-4 py-7 text-center dark:border-white/[0.12] dark:bg-white/[0.02]">
                  <span className="mx-auto grid size-10 place-items-center rounded-full bg-brand/[0.08] text-brand"><CircleUserRound className="size-5" /></span>
                  <p className="mt-2 text-[11px] font-medium">还没有客服渠道</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">填写微信、QQ、Telegram 或上传二维码后保存，这里会立即生成客服卡片。</p>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 border-t border-black/[0.05] pt-3 text-[10px] text-muted-foreground dark:border-white/[0.07]">
                <span className="size-1.5 rounded-full bg-brand" />
                客户通过你的代理链接进入时，会看到这张客服名片
              </div>
            </div>
          </div>
          <p className="px-1 text-[10px] leading-relaxed text-muted-foreground">保存后会立即同步到代理链接、商品详情和导航客服；不会影响平台根路径客服。</p>
        </aside>
      </div>
    </div>
  );
}
