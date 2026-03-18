"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SignalItem = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  cls: "up" | "down";
  values: number[];
};

type ApiResponse = {
  items: SignalItem[];
  fallback?: boolean;
  updatedAt?: number;
};

const ITEMS_PER_PAGE = 4;

function buildPolyline(values: number[], width = 168, height = 34) {
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function samePriceMap(items: SignalItem[]) {
  return Object.fromEntries(items.map((x) => [x.symbol, x.price]));
}

export default function SignalMonitor() {
  const [items, setItems] = useState<SignalItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [flashMap, setFlashMap] = useState<Record<string, "up" | "down" | "none">>({});
  const [page, setPage] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);

  async function loadData(initial = false) {
    try {
      const res = await fetch(`/api/signals?t=${Date.now()}`, { cache: "no-store" });
      const data: ApiResponse = await res.json();

      if (!Array.isArray(data.items)) return;

      setItems((prev) => {
        if (!prev.length) return data.items;

        const prevPrice = samePriceMap(prev);
        const nextFlash: Record<string, "up" | "down" | "none"> = {};

        for (const item of data.items) {
          const oldP = Number(String(prevPrice[item.symbol] || "").replace(/,/g, ""));
          const newP = Number(String(item.price || "").replace(/,/g, ""));

          if (Number.isFinite(oldP) && Number.isFinite(newP) && oldP !== newP) {
            nextFlash[item.symbol] = newP > oldP ? "up" : "down";
          }
        }

        if (Object.keys(nextFlash).length) {
          setFlashMap((m) => ({ ...m, ...nextFlash }));

          if (flashTimerRef.current) clearTimeout(flashTimerRef.current);

          flashTimerRef.current = setTimeout(() => setFlashMap({}), 420);
        }

        return data.items;
      });

      if (initial) setIsReady(true);
    } catch {
      if (initial) setIsReady(true);
    }
  }

  useEffect(() => {
    loadData(true);

    // 行情刷新
    timerRef.current = setInterval(() => loadData(false), 30000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  /* ====== 分页逻辑 ====== */

  const pages = useMemo(() => {
    const p: SignalItem[][] = [];

    for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
      p.push(items.slice(i, i + ITEMS_PER_PAGE));
    }

    return p;
  }, [items]);

  // 自动翻页
  useEffect(() => {
    if (!pages.length) return;

    if (pageTimerRef.current) clearInterval(pageTimerRef.current);

    pageTimerRef.current = setInterval(() => {
      setPage((p) => (p + 1) % pages.length);
    }, 6000);

    return () => {
      if (pageTimerRef.current) clearInterval(pageTimerRef.current);
    };
  }, [pages.length]);

 const currentItems = pages[page] || [];

const filledCurrentItems: SignalItem[] = [...currentItems];

while (filledCurrentItems.length < ITEMS_PER_PAGE) {
  filledCurrentItems.push({
    symbol: `placeholder-${filledCurrentItems.length}`,
    name: "",
    price: "",
    change: "",
    cls: "up",
    values: [],
  });
}

const content = useMemo(
  () =>
    filledCurrentItems.map((item) => {
      if (!item.name) {
        return (
          <div
            className="signal-monitor-row signal-monitor-row-empty"
            key={item.symbol}
          />
        );
      }

      const points = buildPolyline(item.values);
      const lastPoint = points.split(" ").slice(-1)[0] || "168,17";
const lastY = lastPoint.split(",")[1] || "17";
      const flash = flashMap[item.symbol] || "none";

      return (
        <div className="signal-monitor-row" key={item.symbol}>
          <div className="signal-monitor-top">
            <div className="signal-monitor-namewrap">
              <span className="signal-monitor-name">{item.name}</span>
              <span className="signal-monitor-tag">1H</span>
            </div>

            <div className="signal-monitor-right">
              <span
                className={`signal-monitor-price ${
                  flash !== "none" ? `flash-${flash}` : ""
                }`}
              >
                {item.price}
              </span>

              <span className={`val ${item.cls} signal-change`}>
                {item.change}
              </span>
            </div>
          </div>

          <div className="signal-monitor-chart">
            <svg
              viewBox="0 0 168 34"
              preserveAspectRatio="none"
              className="signal-monitor-svg"
            >
              <defs>
                <linearGradient
                  id={`area-${item.symbol.replace("/", "-")}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={
                      item.cls === "up"
                        ? "rgba(49,208,170,0.22)"
                        : "rgba(255,111,145,0.20)"
                    }
                  />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </linearGradient>

                <linearGradient
                  id={`line-${item.symbol.replace("/", "-")}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  {item.cls === "up" ? (
                    <>
                      <stop offset="0%" stopColor="#1df2d0" />
                      <stop offset="45%" stopColor="#7efff1" />
                      <stop offset="75%" stopColor="#27d8ff" />
                      <stop offset="100%" stopColor="#1df2d0" />
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="#ff5e8a" />
                      <stop offset="45%" stopColor="#ff9ab0" />
                      <stop offset="75%" stopColor="#ff6fd4" />
                      <stop offset="100%" stopColor="#ff5e8a" />
                    </>
                  )}
                  <animateTransform
                    attributeName="gradientTransform"
                    type="translate"
                    from="-1 0"
                    to="1 0"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </linearGradient>

                <filter
                  id={`glow-${item.symbol.replace("/", "-")}`}
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation="1.8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

<polygon
  points={`0,34 ${points} 168,34`}
  fill={`url(#area-${item.symbol.replace("/", "-")})`}
  className="signal-monitor-area"
/>

<polyline
  className={`signal-monitor-line-base ${item.cls}`}
  fill="none"
  strokeWidth="1.5"
  points={points}
/>

<polyline
  className={`signal-monitor-line-animated ${item.cls}`}
  fill="none"
  stroke={`url(#line-${item.symbol.replace("/", "-")})`}
  strokeWidth="2.4"
  points={points}
  filter={`url(#glow-${item.symbol.replace("/", "-")})`}
/>

<circle
  cx="168"
  cy={lastY}
  r="2.8"
  className={`signal-monitor-dot-live ${item.cls}`}
/>

<circle
  cx="168"
  cy={lastY}
  r="6"
  className={`signal-monitor-dot-live-glow ${item.cls}`}
/>
            </svg>

            <div className="signal-monitor-grid" />
          </div>
        </div>
      );
    }),
  [filledCurrentItems, flashMap]
);


 return (
  <section className="signal-monitor-panel">
    <div className="signal-monitor-head">
      <div className="signal-monitor-head-left">
        <div className="signal-monitor-kicker">MARKET SURVEILLANCE</div>
        <div className="signal-monitor-title-row">
          <h3 className="signal-monitor-title">SIGNAL MONITOR</h3>
        </div>
      </div>

      <div className={`signal-monitor-status ${isReady ? "live" : ""}`}>
        <span className="signal-monitor-dot" />
        <span>{isReady ? "LIVE / 30S" : "SYNCING"}</span>
      </div>
    </div>

    <div className="signal-monitor-body">
      {items.length ? (
        content
      ) : (
        <>
          {[1, 2, 3, 4].map((n) => (
            <div className="signal-monitor-row skeleton" key={n}>
              <div className="signal-monitor-top">
                <div className="signal-monitor-skeleton line w1" />
                <div className="signal-monitor-skeleton line w2" />
              </div>
              <div className="signal-monitor-skeleton chart" />
            </div>
          ))}
        </>
      )}
    </div>

<div className="signal-monitor-footer">
  <button
    type="button"
    className="signal-monitor-nav"
    onClick={() =>
      setPage((p) => (p - 1 + Math.max(pages.length, 1)) % Math.max(pages.length, 1))
    }
    disabled={!pages.length}
    aria-label="Previous page"
  >
    〈
  </button>

  <span className="signal-monitor-page">
    {page + 1}/{pages.length || 1}
  </span>

  <button
    type="button"
    className="signal-monitor-nav"
    onClick={() =>
      setPage((p) => (p + 1) % Math.max(pages.length, 1))
    }
    disabled={!pages.length}
    aria-label="Next page"
  >
    〉
  </button>
</div>

    <div className="signal-monitor-scan" />
  </section>
);
}