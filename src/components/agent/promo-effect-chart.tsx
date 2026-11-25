"use client";

import { useState } from "react";

type EffectPoint = {
  day: string;
  visitors: number;
  opens: number;
  orders: number;
  paid: number;
};

const SERIES = [
  { key: "visitors" as const, label: "访客", color: "#7c5cff" },
  { key: "opens" as const, label: "链接打开", color: "#2bb8a3" },
  { key: "orders" as const, label: "下单", color: "#f2a93b" },
  { key: "paid" as const, label: "付款", color: "#f25c9d" },
];

const W = 760;
const H = 236;
const PAD = { left: 36, right: 14, top: 16, bottom: 30 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

export function PromoEffectChart({ effect }: { effect: EffectPoint[] }) {
  const [active, setActive] = useState<number | null>(null);

  const maxValue = Math.max(1, ...effect.flatMap((row) => [row.visitors, row.opens, row.orders, row.paid]));
  const pointX = (i: number) => PAD.left + (effect.length <= 1 ? INNER_W / 2 : (i / (effect.length - 1)) * INNER_W);
  const pointY = (value: number) => PAD.top + INNER_H - (value / maxValue) * INNER_H;

  const labelStep = effect.length <= 7 ? 1 : Math.ceil(effect.length / 6);
  const labelIndexes = new Set<number>();
  for (let i = 0; i < effect.length; i += labelStep) labelIndexes.add(i);
  if (effect.length > 0) labelIndexes.add(effect.length - 1);

  const activeRow = active === null ? null : effect[active];
  const activeX = active === null ? 0 : pointX(active);
  const tooltipAlign =
    active === null || effect.length === 1
      ? "translateX(-50%)"
      : active <= 1
        ? "translateX(0)"
        : active >= effect.length - 2
          ? "translateX(-100%)"
          : "translateX(-50%)";

  return (
    <div className="mt-5 overflow-x-auto pb-1">
      <div className="relative min-w-[620px]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="推广效果趋势图"
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") setActive(null);
          }}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={PAD.top + INNER_H * t}
                y2={PAD.top + INNER_H * t}
                stroke="currentColor"
                strokeOpacity="0.06"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 8}
                y={PAD.top + INNER_H * t + 3}
                textAnchor="end"
                fontSize="9"
                fill="currentColor"
                opacity="0.4"
              >
                {Math.round(maxValue * (1 - t))}
              </text>
            </g>
          ))}

          {effect.map((row, i) =>
            labelIndexes.has(i) ? (
              <text
                key={`label-${row.day}`}
                x={pointX(i)}
                y={H - 8}
                textAnchor={i === 0 ? "start" : i === effect.length - 1 ? "end" : "middle"}
                fontSize="9"
                fill="currentColor"
                opacity="0.45"
              >
                {row.day.slice(5)}
              </text>
            ) : null,
          )}

          {SERIES.map((series) => (
            <g key={series.key}>
              <polyline
                fill="none"
                stroke={series.color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={effect.map((row, i) => `${pointX(i)},${pointY(row[series.key])}`).join(" ")}
              />
              {effect.map((row, i) => (
                <circle
                  key={i}
                  cx={pointX(i)}
                  cy={pointY(row[series.key])}
                  r={effect.length <= 7 ? 2.4 : 1.2}
                  fill={series.color}
                />
              ))}
            </g>
          ))}

          {activeRow && (
            <>
              <line
                x1={activeX}
                x2={activeX}
                y1={PAD.top}
                y2={PAD.top + INNER_H}
                stroke="currentColor"
                strokeOpacity="0.2"
                strokeDasharray="3 3"
              />
              {SERIES.map((series) => (
                <circle
                  key={series.key}
                  cx={activeX}
                  cy={pointY(activeRow[series.key])}
                  r="3.5"
                  fill={series.color}
                  stroke="white"
                  strokeWidth="1.5"
                />
              ))}
            </>
          )}

          {effect.map((row, i) => {
            const bandWidth = INNER_W / effect.length;
            return (
              <rect
                key={row.day}
                x={PAD.left + i * bandWidth}
                y={PAD.top}
                width={bandWidth}
                height={INNER_H}
                fill="transparent"
                pointerEvents="all"
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") setActive(i);
                }}
                onPointerDown={() => setActive(i)}
                onClick={() => setActive(i)}
              />
            );
          })}
        </svg>

        {activeRow && (
          <div
            className="pointer-events-none absolute top-1 z-10 w-44 rounded-xl border border-foreground/10 bg-popover/95 p-2.5 shadow-xl backdrop-blur"
            style={{ left: `${(activeX / W) * 100}%`, transform: tooltipAlign }}
          >
            <div className="text-[10px] font-medium text-muted-foreground">{activeRow.day}</div>
            <div className="mt-1.5 space-y-1">
              {SERIES.map((series) => (
                <div key={series.key} className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="size-2 rounded-full" style={{ background: series.color }} />
                    {series.label}
                  </span>
                  <span className="font-mono font-semibold">{activeRow[series.key]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-4">
          {SERIES.map((series) => (
            <span key={series.key} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: series.color }} />
              {series.label}
            </span>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground/70">悬停或点击曲线查看当日数据</span>
      </div>
    </div>
  );
}
