"use client";
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, Info, Plus, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ImageField } from "@/components/admin/image-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { THEME_LABEL, THEMES, type ThemeName } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ProductFormValues = {
  id?: number;
  categoryId: number | null;
  name: string;
  slug: string;
  subtitle: string;
  badge: string;
  description: string;
  image: string;
  theme: string;
  deliveryHint: string;
  warnings: string[];
  notes: { title: string; body: string }[];
  requireEmail: boolean;
  isExpiring: boolean;
  validityDays: number;
  listed: boolean;
  sort: number;
};

const EMPTY: ProductFormValues = {
  categoryId: null,
  name: "",
  slug: "",
  subtitle: "",
  badge: "",
  description: "",
  image: "",
  theme: "violet",
  deliveryHint: "账号资料与接码链接，付款后自动交付",
  warnings: [],
  notes: [],
  requireEmail: true,
  isExpiring: false,
  validityDays: 30,
  listed: true,
  sort: 0,
};

const THEME_SWATCH: Record<string, string> = {
  violet: "linear-gradient(135deg,#7c5cff,#d96bff)",
  emerald: "linear-gradient(135deg,#2fbf8f,#5cc8ff)",
  sky: "linear-gradient(135deg,#4a9bff,#57d0ff)",
  amber: "linear-gradient(135deg,#f0a028,#ff7a45)",
  rose: "linear-gradient(135deg,#f25c86,#ff9a76)",
  mono: "linear-gradient(135deg,#6b7280,#a1a1aa)",
};

export function ProductForm({
  action,
  values = EMPTY,
  mode,
  categories,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values?: ProductFormValues;
  mode: "create" | "edit";
  categories: { id: number; name: string }[];
}) {
  const [notes, setNotes] = useState(values.notes);
  const [warnings, setWarnings] = useState(values.warnings.join("\n"));
  const [requireEmail, setRequireEmail] = useState(values.requireEmail);
  const [isExpiring, setIsExpiring] = useState(values.isExpiring);
  const [validityDays, setValidityDays] = useState(values.validityDays || 30);
  const [listed, setListed] = useState(values.listed);
  const [theme, setTheme] = useState(values.theme || "violet");

  function addNote() {
    setNotes((n) => [...n, { title: "", body: "" }]);
  }
  function updateNote(i: number, patch: Partial<{ title: string; body: string }>) {
    setNotes((n) => n.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeNote(i: number) {
    setNotes((n) => n.filter((_, idx) => idx !== i));
  }
  function moveNote(i: number, dir: -1 | 1) {
    setNotes((n) => {
      const j = i + dir;
      if (j < 0 || j >= n.length) return n;
      const copy = [...n];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  return (
    <form action={action} className="space-y-4 pb-20">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="notes" value={JSON.stringify(notes)} />
      <input type="hidden" name="requireEmail" value={requireEmail ? "1" : ""} />
      <input type="hidden" name="isExpiring" value={isExpiring ? "1" : ""} />
      <input type="hidden" name="listed" value={listed ? "1" : ""} />
      <input type="hidden" name="theme" value={theme} />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {/* 基本信息 */}
          <Section title="基本信息" desc="商品名称与链接标识">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="商品名称" required className="sm:col-span-2">
                <input
                  name="name"
                  defaultValue={values.name}
                  required
                  maxLength={120}
                  placeholder="例如：Muse AI 成品号"
                  className={inputCls}
                />
              </Field>
              <Field label="商品分类" required className="sm:col-span-2" hint="每个商品必须选择一个分类">
                <div className="relative">
                  <select
                    name="categoryId"
                    defaultValue={values.categoryId ?? ""}
                    required
                    className={cn(inputCls, "appearance-none pr-9")}
                  >
                    <option value="" disabled>
                      请选择分类
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                {categories.length === 0 && (
                  <span className="mt-1.5 block text-[12px] text-rose-600 dark:text-rose-400">
                    还没有分类，请先到 <Link href="/admin/categories" className="underline underline-offset-2">分类管理</Link> 创建分类。
                  </span>
                )}
              </Field>
              <Field label="链接标识（slug）" hint="只支持小写字母、数字和 -，留空自动生成">
                <input
                  name="slug"
                  defaultValue={values.slug}
                  maxLength={64}
                  placeholder="muse-ai"
                  className={cn(inputCls, "font-mono")}
                />
              </Field>
              <Field label="排序" hint="数字越小越靠前">
                <input
                  name="sort"
                  type="number"
                  defaultValue={values.sort ?? 0}
                  className={cn(inputCls, "font-mono")}
                />
              </Field>
              <Field label="副标题" className="sm:col-span-2">
                <input
                  name="subtitle"
                  defaultValue={values.subtitle}
                  maxLength={160}
                  placeholder="成品账号 · 即买即用"
                  className={inputCls}
                />
              </Field>
              <Field label="角标" hint="显示在商品卡片左上角，可留空">
                <input
                  name="badge"
                  defaultValue={values.badge}
                  maxLength={40}
                  placeholder="热卖 / 不懂不要下单"
                  className={inputCls}
                />
              </Field>
              <Field label="交付方式说明">
                <input
                  name="deliveryHint"
                  defaultValue={values.deliveryHint}
                  maxLength={160}
                  placeholder="账号资料与接码链接，付款后自动交付"
                  className={inputCls}
                />
              </Field>
              <Field label="商品描述" className="sm:col-span-2" hint="支持换行，展示在商品标题下方">
                <textarea
                  name="description"
                  defaultValue={values.description}
                  rows={4}
                  placeholder="简短介绍商品包含的内容、适用人群与注意事项…"
                  className={cn(inputCls, "h-auto resize-y py-2.5 leading-relaxed")}
                />
              </Field>
            </div>
          </Section>

          {/* 购买须知 */}
          <Section
            title="购买须知"
            desc="每件商品都可以有自己的须知，前台会在商品详情与下单区域展示"
            action={
              <button
                type="button"
                onClick={addNote}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-foreground/10 px-2.5 text-[13px] transition hover:border-foreground/25"
              >
                <Plus className="size-3.5" />
                添加一条
              </button>
            }
          >
            <Field label="醒目警告" hint="每行一条，展示在橙色警示卡中；支持使用 - 开头做列表">
              <textarea
                name="warnings"
                value={warnings}
                onChange={(e) => setWarnings(e.target.value)}
                rows={4}
                placeholder={"购买后请尽快登录换绑，超时不在售后范围\n因网络环境导致的封号不在售后范围"}
                className={cn(inputCls, "h-auto resize-y py-2.5 leading-relaxed")}
              />
            </Field>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium">须知条目</span>
                <span className="text-[12px] text-muted-foreground">{notes.length} 条 · 支持折叠时间轴展示</span>
              </div>
              {notes.length === 0 ? (
                <button
                  type="button"
                  onClick={addNote}
                  className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-foreground/15 py-8 text-[13px] text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
                >
                  <Sparkles className="size-4" />
                  还没有须知，点击添加第一条
                </button>
              ) : (
                <div className="space-y-2.5">
                  {notes.map((note, i) => (
                    <div key={i} className="group rounded-xl border border-foreground/[0.08] bg-foreground/[0.015] p-3">
                      <div className="flex items-center gap-2">
                        <span className="grid size-5 shrink-0 place-items-center rounded-md bg-foreground font-mono text-[12px] text-background">
                          {i + 1}
                        </span>
                        <input
                          value={note.title}
                          onChange={(e) => updateNote(i, { title: e.target.value })}
                          placeholder="条目标题，例如「仅质保首次登录」"
                          className="h-8 flex-1 rounded-lg border border-transparent bg-background/60 px-2.5 text-xs font-medium outline-none transition focus:border-foreground/15 focus:bg-background"
                        />
                        <div className="flex shrink-0 items-center gap-0.5 opacity-60 transition group-hover:opacity-100">
                          <IconBtn label="上移" onClick={() => moveNote(i, -1)} disabled={i === 0}>
                            <ArrowUp className="size-3" />
                          </IconBtn>
                          <IconBtn label="下移" onClick={() => moveNote(i, 1)} disabled={i === notes.length - 1}>
                            <ArrowDown className="size-3" />
                          </IconBtn>
                          <IconBtn label="删除" onClick={() => removeNote(i)} danger>
                            <Trash2 className="size-3" />
                          </IconBtn>
                        </div>
                      </div>
                      <textarea
                        value={note.body}
                        onChange={(e) => updateNote(i, { body: e.target.value })}
                        rows={3}
                        placeholder="条目内容，支持换行；以 - 开头会自动显示为列表"
                        className="mt-2 w-full resize-y rounded-lg border border-transparent bg-background/60 px-2.5 py-2 text-xs leading-relaxed outline-none transition focus:border-foreground/15 focus:bg-background"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          {/* 上架状态 */}
          <Section title="上架状态">
            <div className="space-y-3">
              <SwitchRow
                checked={listed}
                onChange={setListed}
                label="前台展示"
                desc="关闭后商品将从首页与商品页隐藏，但订单与后台数据保留"
              />
              <div className="h-px bg-foreground/[0.06]" />
              <SwitchRow
                checked={requireEmail}
                onChange={setRequireEmail}
                label="必须填写收件邮箱"
                desc="游客下单时需要填写邮箱，交付内容会同时发送到邮箱"
              />
            </div>
          </Section>

          {/* 会员有效期 */}
          <Section title="会员 / 订阅商品" desc="用于会员、周期订阅等会过期的商品">
            <div className="space-y-3">
              <SwitchRow
                checked={isExpiring}
                onChange={(v) => {
                  setIsExpiring(v);
                  if (v && !validityDays) setValidityDays(30);
                }}
                label="这是会过期的商品"
                desc="开启后可设置有效期；交付后会在代理客户列表显示具体商品的到期时间"
              />
              {isExpiring && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium">有效期（天）</span>
                  <input
                    name="validityDays"
                    type="number"
                    min={1}
                    max={3650}
                    value={validityDays}
                    onChange={(e) => setValidityDays(Math.max(1, Math.min(3650, Number(e.target.value) || 1)))}
                    className={cn(inputCls, "font-mono")}
                  />
                  <span className="mt-1 block text-[11px] text-muted-foreground">从订单交付时间开始计算，到期后客户商品状态变为「会员已到期」。</span>
                </label>
              )}
              {!isExpiring && <input type="hidden" name="validityDays" value="0" />}
            </div>
          </Section>

          {/* 商品图 */}
          <Section title="商品图" desc="展示在首页卡片与商品详情左侧舞台">
            <ImageField name="image" defaultValue={values.image} />
          </Section>

          {/* 主题色 */}
          <Section title="卡片主题色" desc="决定商品卡片的渐变、光晕与按钮强调色">
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition",
                    theme === t
                      ? "border-foreground/25 bg-foreground/[0.04] shadow-sm"
                      : "border-foreground/[0.08] hover:border-foreground/20",
                  )}
                >
                  <span
                    className="size-7 shrink-0 rounded-lg shadow-inner"
                    style={{ background: THEME_SWATCH[t] }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium">{THEME_LABEL[t as ThemeName]}</span>
                    <span className="block font-mono text-[11px] text-muted-foreground">{t}</span>
                  </span>
                  <span
                    className={cn(
                      "grid size-4 shrink-0 place-items-center rounded-full border",
                      theme === t ? "border-transparent bg-foreground text-background" : "border-foreground/20",
                    )}
                  >
                    {theme === t && <span className="size-1.5 rounded-full bg-background" />}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          <div className="flex items-start gap-2 rounded-xl border border-foreground/[0.07] bg-foreground/[0.02] p-3 text-[12px] leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <p>
              创建商品后，在编辑页下方可以添加规格、价格与库存。每个商品至少需要一个规格才能被购买。
            </p>
          </div>
        </div>
      </div>

      {/* 底部保存条 */}
      <div className="sticky bottom-3 z-20 mx-auto flex w-full max-w-3xl items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-background/85 p-2.5 pl-4 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <div className="min-w-0 text-[13px]">
          <span className="font-medium">{mode === "create" ? "创建新商品" : "编辑商品"}</span>
          <span className="ml-2 hidden text-muted-foreground sm:inline">
            {mode === "create" ? "创建后可继续添加规格与库存" : "保存后立即生效于前台"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/admin/products"
            className="inline-flex h-9 items-center rounded-lg border border-foreground/10 px-3 text-xs text-muted-foreground transition hover:text-foreground"
          >
            取消
          </Link>
          <SubmitButton pendingText="保存中…">{mode === "create" ? "创建商品" : "保存修改"}</SubmitButton>
        </div>
      </div>
    </form>
  );
}

const inputCls =
  "h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-transparent focus:ring-[1.5px] focus:ring-brand";

function Section({
  title,
  desc,
  action,
  children,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 backdrop-blur sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <GripVertical className="size-3.5 text-muted-foreground/40" />
            {title}
          </h3>
          {desc && <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{desc}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-center gap-1 text-xs font-medium">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

function SwitchRow({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-xs font-medium">{label}</div>
        <div className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{desc}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-emerald-500" : "bg-foreground/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-all",
            checked ? "left-[18px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground disabled:opacity-25",
        danger && "hover:bg-rose-500/10 hover:text-rose-500",
      )}
    >
      {children}
    </button>
  );
}
