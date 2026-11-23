"use client";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export function AgentQrUpload({ name, defaultValue = "" }: { name: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/agent/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上传失败");
      setValue(data.url);
      toast.success("二维码已上传");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center gap-3">
        <div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-black/[0.1] bg-black/[0.02] dark:border-white/[0.12] dark:bg-white/[0.03]">
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="微信二维码预览" className="size-full object-cover" />
              <button type="button" onClick={() => setValue("")} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/55 text-white" aria-label="移除二维码"><X className="size-3" /></button>
            </>
          ) : (
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-5" />}
              <span className="text-[10px]">{uploading ? "上传中" : "上传二维码"}</span>
            </button>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium">微信二维码</p>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">支持 PNG / JPG / WEBP，不超过 2MB，会展示给买家。</p>
          {value && <button type="button" onClick={() => inputRef.current?.click()} className="mt-1 text-[10px] text-brand hover:underline">更换图片</button>}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
    </div>
  );
}
