"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function CodeAutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, router]);
  return null;
}

type ParsedCode = { code: string; context: string; label?: string };

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(value: string): Uint8Array | null {
  const clean = value.toUpperCase().replace(/[\s-]/g, "").replace(/=+$/g, "");
  if (clean.length < 16 || !/^[A-Z2-7]+$/.test(clean)) return null;
  let bits = 0;
  let buffer = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index < 0) return null;
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >>> bits) & 0xff);
    }
  }
  return bytes.length ? new Uint8Array(bytes) : null;
}

async function generateTotp(secret: string): Promise<string | null> {
  const keyBytes = base32Decode(secret);
  if (!keyBytes) return null;
  try {
    const keyData = keyBytes.buffer.slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength) as ArrayBuffer;
    const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
    const counter = new ArrayBuffer(8);
    const view = new DataView(counter);
    view.setUint32(0, Math.floor(Date.now() / 30_000 / 0x100000000));
    view.setUint32(4, Math.floor(Date.now() / 30_000) >>> 0);
    const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, counter));
    const offset = digest[digest.length - 1] & 0xf;
    const binary =
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);
    return String(binary % 1_000_000).padStart(6, "0");
  } catch {
    return null;
  }
}

export function CodeParser() {
  const [input, setInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParsedCode[]>([]);

  async function parse() {
    setParsing(true);
    const normalized = input
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/[\uFF10-\uFF19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // 有些邮件把 123456 渲染成「123 456」或「123-456」，先做一份去分隔符版本
    const compact = normalized.replace(/(?<=\d)[\s\-–—·•]+(?=\d)/g, "");
    const found = new Map<string, { code: string; context: string; priority: number }>();

    const phrases = "验证码|校验码|动态码|确认码|认证码|安全码|二步验证|两步验证|verification\\s*code|security\\s*code|authentication\\s*code|login\\s*code|one[-\\s]?time\\s*(?:code|password)|passcode|code(?:\\s*is|\\s*:|\\s*=)|otp|2fa|two[-\\s]?factor";
    const preferred = [
      new RegExp(`(?:${phrases})[^0-9]{0,48}(\\d{4,8})`, "gi"),
      new RegExp(`(\\d{4,8})[^0-9]{0,24}(?:${phrases})`, "gi"),
    ];

    function add(code: string, source: string, index: number, priority: number) {
      if (code.length < 4 || code.length > 8) return;
      const context = source.slice(Math.max(0, index - 36), index + code.length + 36).trim();
      const prev = found.get(code);
      if (!prev || priority > prev.priority) found.set(code, { code, context, priority });
    }

    for (const source of [normalized, compact]) {
      for (const re of preferred) {
        for (const match of source.matchAll(re)) {
          const code = match[1].replace(/\D/g, "");
          // match[1] 可能是数字，index 需要落在数字附近
          const index = (match.index ?? 0) + match[0].lastIndexOf(match[1]);
          add(code, source, index, code.length >= 6 ? 3 : 2);
        }
      }
    }

    // 没有上下文时只兜底独立 6 位数字，避免把价格/日期等误识别
    for (const match of compact.matchAll(/(?<!\d)(\d{6})(?!\d)/g)) {
      add(match[1], compact, match.index ?? 0, 1);
    }

    const parsed: ParsedCode[] = [...found.values()].sort((a, b) => b.priority - a.priority).map(({ code, context }) => ({ code, context }));

    // Base32 TOTP 密钥（例如 VQKROIRRJGI335ZUPDWTRN7W）直接生成当前 6 位动态码
    const secretCandidates = new Set<string>();
    const compactInput = normalized.replace(/[\s-]/g, "").toUpperCase();
    if (/^[A-Z2-7]{16,64}$/.test(compactInput)) secretCandidates.add(compactInput);
    for (const match of normalized.matchAll(/(?:secret|密钥|2fa|otp|authenticator|验证器)[^A-Z2-7]{0,32}([A-Z2-7]{16,64})/gi)) {
      secretCandidates.add(match[1].toUpperCase());
    }
    for (const secret of secretCandidates) {
      const code = await generateTotp(secret);
      if (code) parsed.unshift({ code, context: `2FA 密钥 · TOTP 30 秒 · 剩余 ${30 - (Math.floor(Date.now() / 1000) % 30)} 秒`, label: "TOTP 动态码" });
    }

    setResult(parsed);
    setParsing(false);
  }
  return (
    <div className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 sm:p-5">
      <h2 className="text-sm font-semibold">2FA / 邮箱内容解析</h2>
      <p className="mt-1 text-[12px] text-muted-foreground">把收到的邮件正文或 2FA 文本粘贴到下面，自动提取验证码。</p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={5}
        placeholder="例如：您的验证码是 123456；2FA 文本也可能显示为 123 456。"
        className="mt-3 w-full resize-y rounded-xl border border-foreground/10 bg-background px-3 py-2.5 font-mono text-xs leading-relaxed outline-none transition placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">支持 4–8 位数字、空格/连字符拆分和 HTML 拆分；无上下文时兜底识别 6 位数字。</p>
        <button type="button" onClick={parse} disabled={!input.trim() || parsing} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-[11px] font-medium text-background disabled:opacity-40">
          {parsing ? <Loader2 className="size-3 animate-spin" /> : null}
          {parsing ? "解析中…" : input.trim() ? "解析验证码 / 2FA" : "等待粘贴"}
        </button>
      </div>
      {result.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {result.map((r) => (
            <button
              key={r.code}
              type="button"
              onClick={() => navigator.clipboard.writeText(r.code)}
              title={r.context}
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-2 text-left transition hover:border-emerald-500/40"
            >
              {r.label && <span className="mb-0.5 block text-[9px] font-medium text-brand">{r.label}</span>}
              <span className="block font-mono text-xl font-semibold tracking-[0.2em] text-emerald-700 dark:text-emerald-300">{r.code}</span>
              <span className="mt-0.5 block max-w-[220px] truncate text-[10px] text-muted-foreground">{r.context}</span>
            </button>
          ))}
        </div>
      )}
      {input.trim() && result.length === 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Loader2 className="size-3" /> 没找到验证码，检查文本中是否包含 4–8 位数字；带空格或连字符的验证码也可以识别。</p>
      )}
    </div>
  );
}
