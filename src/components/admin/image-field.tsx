"use client";
import { ImagePlus, Link2, Loader2, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ImageField({ name, defaultValue = "" }: { name: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("请选择图片文件");
    if (file.size > 5 * 1024 * 1024) return toast.error("图片不能超过 5MB");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上传失败");
      setValue(data.url);
      toast.success("图片上传成功");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void upload(f);
          }}
          className={cn(
            "relative flex aspect-[4/3] w-full shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed transition sm:w-40",
            dragging ? "border-brand bg-brand/[0.06]" : "border-foreground/15 bg-foreground/[0.02]",
          )}
        >
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="商品图预览" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => setValue("")}
                className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
                aria-label="移除图片"
              >
                <X className="size-3" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground transition hover:text-foreground"
            >
              {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-6" />}
              <span className="text-[13px]">{uploading ? "上传中…" : "上传商品图"}</span>
              <span className="text-[12px] text-muted-foreground/70">或拖拽图片到这里</span>
            </button>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="/products/xxx.svg 或 https://…"
                className="h-9 w-full rounded-lg border border-foreground/10 bg-background pl-9 pr-3 font-mono text-[13px] outline-none transition focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
              />
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-foreground/10 px-3 text-[13px] transition hover:border-foreground/25 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <UploadCloud className="size-3.5" />}
              上传
            </button>
          </div>
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            支持 PNG / JPG / WEBP / GIF / SVG，单张不超过 5MB。上传后保存在服务器 storage 目录，方便随数据库一起备份。
          </p>
          <div className="mt-auto flex flex-wrap gap-1.5">
            {[
              { label: "示例 · Muse", value: "/products/muse.svg" },
              { label: "示例 · GPT Plus", value: "/products/plus-japan.svg" },
            ].map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setValue(preset.value)}
                className="rounded-full border border-foreground/10 px-2.5 py-1 text-[12px] text-muted-foreground transition hover:border-foreground/25 hover:text-foreground"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
