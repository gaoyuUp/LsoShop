"use client";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import type { PublicProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { useT } from "@/i18n/provider";
import "./folder-product-card.css";

const DESIGN_WIDTH = 340;
const MAX_SHEETS = 4;
const JX = [-3.2, 2.4, -1.6, 3.4];
const JR = [-1.7, 1.3, -0.8, 1.7];
const BACK_ART: Record<string, string> = {
  sky: "aurora",
  violet: "dusk",
  emerald: "verdant",
  amber: "ember",
  rose: "aurora",
  mono: "glacier",
};

function fanSlot(index: number, count: number) {
  return count <= 1 ? 0 : (index / (count - 1)) * 2 - 1;
}

export function FolderProductCard({ product, index, href }: { product: PublicProduct; index: number; href: string }) {
  const t = useT();
  const rootRef = useRef<HTMLDivElement>(null);
  const filesId = useId();
  const [open, setOpen] = useState(false);

  const backArt = BACK_ART[product.theme] ?? "aurora";
  const stock = product.totalStock;
  const sheetCount = stock === null ? MAX_SHEETS : Math.min(MAX_SHEETS, stock);
  const stockTone = stock === null ? "manual" : stock <= 0 ? "out" : stock <= 2 ? "low" : "ok";
  const stockLabel = stock === null ? t.product.manual : stock <= 0 ? t.product.soldOut : t.product.stock(stock);
  const stockDot =
    stockTone === "out"
      ? "fpc-stock-out"
      : stockTone === "low"
        ? "fpc-stock-low"
        : stockTone === "manual"
          ? "fpc-stock-manual"
          : "";

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const update = () => {
      root.style.setProperty("--scale", String(Math.min(1, root.clientWidth / DESIGN_WIDTH)));
    };
    const observer = new ResizeObserver(update);
    observer.observe(root);
    update();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function tilt(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch" || window.innerWidth < 640 || !rootRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    rootRef.current.style.setProperty("--px", String(((event.clientX - rect.left) / rect.width) * 2 - 1));
    rootRef.current.style.setProperty("--py", String(((event.clientY - rect.top) / rect.height) * 2 - 1));
  }

  function resetTilt() {
    rootRef.current?.style.setProperty("--px", "0");
    rootRef.current?.style.setProperty("--py", "0");
  }

  return (
    <motion.div
      ref={rootRef}
      data-theme={product.theme}
      data-art={backArt}
      data-open={open ? "true" : undefined}
      className="fpc-root"
      initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      onPointerMove={tilt}
      onPointerLeave={resetTilt}
    >
      <div className="fpc-frame">
        <div className="fpc-stage">
        <div className="fpc-tilt">
          <div className="fpc-shadow" aria-hidden />
          <div className="fpc-back" aria-hidden>
            <div className="fpc-sheen" />
          </div>
          <svg className="fpc-rim fpc-back-rim" viewBox="0 0 340 272" aria-hidden>
            <path d="M0 56A22 22 0 0 1 22 34L146 34C170 34 172 0 198 0L318 0A22 22 0 0 1 340 22L340 250A22 22 0 0 1 318 272L22 272A22 22 0 0 1 0 250Z" />
          </svg>

          <div className="fpc-front">
            <div className="fpc-spec" aria-hidden />
            <svg className="fpc-rim fpc-front-rim" viewBox="0 0 340 198" aria-hidden>
              <path d="M0 22A22 22 0 0 1 22 0L118 0C144 0 146 32 172 32L318 32A22 22 0 0 1 340 54L340 176A22 22 0 0 1 318 198L22 198A22 22 0 0 1 0 176Z" />
            </svg>
            <button
              type="button"
              className="fpc-hit"
              aria-expanded={open}
              aria-controls={filesId}
              aria-label={sheetCount > 0 ? `${open ? "收起" : "展开"}${product.name}库存卡片` : `${product.name}已售罄`}
              disabled={sheetCount === 0}
              onClick={() => setOpen((value) => !value)}
            />
            <div className="fpc-label">
              <div className="fpc-eyebrow">
                <span>{product.categoryName}</span>
                {product.badge && <span className="fpc-badge">{product.badge}</span>}
              </div>
              <div className="fpc-title-row">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt="" className="fpc-logo" draggable={false} />
                ) : null}
                <div className="fpc-title-wrap">
                  <div className="fpc-title">{product.name}</div>
                </div>
              </div>
              <div className="fpc-price-row">
                <span className="fpc-currency">¥</span>
                <span className="fpc-price">{formatPrice(product.minPriceCents)}</span>
                {product.variants.length > 1 && <span className="fpc-from">{t.product.from}</span>}
                {product.compareAtPriceCents > product.minPriceCents && (
                  <span className="fpc-compare">¥{formatPrice(product.compareAtPriceCents)}</span>
                )}
              </div>
              <div className="fpc-meta">
                <span className={`fpc-stock-dot ${stockDot}`} />
                <span className={stockTone === "manual" ? "fpc-manual-text" : undefined}>{stockLabel}</span>
                <span>·</span>
                <span>{product.variants.length} 个规格</span>
              </div>
            </div>
          </div>

          <div id={filesId} className="fpc-files" aria-hidden={!open}>
            {Array.from({ length: sheetCount }, (_, i) => (
              <Link
                key={i}
                href={href}
                tabIndex={open ? 0 : -1}
                aria-label={`查看${product.name}详情`}
                className="fpc-sheet"
                style={
                  {
                    "--slot": fanSlot(i, sheetCount),
                    "--depth": sheetCount - 1 - i,
                    "--jx": `${JX[i]}px`,
                    "--jr": `${JR[i]}deg`,
                    zIndex: i + 1,
                  } as CSSProperties
                }
              >
                <span className="fpc-sheet-head">
                  <span className="fpc-sheet-name">{product.name}</span>
                  <span className="fpc-sheet-meta">
                    {`${String(i + 1).padStart(2, "0")} / ${String(sheetCount).padStart(2, "0")} · ¥${formatPrice(product.minPriceCents)}`}
                  </span>
                </span>
                <span className="fpc-sheet-lines" aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt="" className="fpc-sheet-mark" draggable={false} />
                ) : null}
              </Link>
            ))}
          </div>

          <Link href={href} className="fpc-key" aria-label={`查看${product.name}详情`}>
            <ArrowUpRight className="fpc-key-icon" />
          </Link>
        </div>
        </div>
      </div>

      <Link href={href} className="fpc-mobile-info" aria-label={`查看${product.name}详情`}>
        <div className="fpc-mobile-price">
          <span className="fpc-currency">¥</span>
          <span className="fpc-price">{formatPrice(product.minPriceCents)}</span>
          {product.variants.length > 1 && <span className="fpc-from">{t.product.from}</span>}
          {product.compareAtPriceCents > product.minPriceCents && (
            <span className="fpc-compare">¥{formatPrice(product.compareAtPriceCents)}</span>
          )}
        </div>
        <div className="fpc-mobile-meta">
          <span className={`fpc-stock-dot ${stockDot}`} />
          <span className={stockTone === "manual" ? "fpc-manual-text" : undefined}>{stockLabel}</span>
          <span>·</span>
          <span>{product.variants.length} 个规格</span>
        </div>
      </Link>
    </motion.div>
  );
}
