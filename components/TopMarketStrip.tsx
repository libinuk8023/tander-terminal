"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type StripItem = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  cls: "up" | "down";
  values: number[];
};

type ApiResponse = {
  items: StripItem[];
  fallback?: boolean;
  updatedAt?: string;
};

function buildPolyline(values: number[], width = 124, height = 24) {
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

function samePriceMap(items: StripItem[]) {
  return Object.fromEntries(items.map((x) => [x.symbol, x.price]));
}

export default function TopMarketStrip() {
  const [items, setItems] = useState<StripItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [flashMap, setFlashMap] = useState<Record<string, "up" | "down" | "none">>({});

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);

  async function loadData(initial = false) {
    try {
      const res = await fetch(`/api/top-strip?t=${Date.now()}`, { cache: "no-store" });
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
          flashTimerRef.current = setTimeout(() => setFlashMap({}), 450);
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
    timerRef.current = setInterval(() => loadData(false), 30000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const displayItems = useMemo(() => items.slice(0, 5), [items]);

  return (
    <div className="top-market-strip">
      <div className="top-market-strip-head">
        <span className={`top-market-strip-status ${isReady ? "live" : ""}`}></span>
      </div>

      <div className="top-market-strip-grid">
        {displayItems.map((item) => {
          const points = buildPolyline(item.values);
          const flash = flashMap[item.symbol] || "none";

          return (
            <div className="top-market-strip-card" key={item.symbol}>
              <div className="top-market-strip-left">
                <div className="top-market-strip-symbol">{item.symbol}</div>
                <div className="top-market-strip-name">{item.name}</div>
              </div>

              <div className="top-market-strip-chart">
                <svg
                  viewBox="0 0 124 24"
                  preserveAspectRatio="none"
                  className="top-market-strip-svg"
                >
                  <defs>
                    <linearGradient id={`strip-line-${item.symbol}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      {item.cls === "up" ? (
                        <>
                          <stop offset="0%" stopColor="#4f92ff" />
                          <stop offset="45%" stopColor="#9fc8ff" />
                          <stop offset="100%" stopColor="#4f92ff" />
                        </>
                      ) : (
                        <>
                          <stop offset="0%" stopColor="#ff6f91" />
                          <stop offset="45%" stopColor="#ffabc0" />
                          <stop offset="100%" stopColor="#ff6f91" />
                        </>
                      )}
                    </linearGradient>

                    <linearGradient id={`strip-area-${item.symbol}`} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={item.cls === "up" ? "rgba(79,146,255,0.18)" : "rgba(255,111,145,0.16)"}
                      />
                      <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                    </linearGradient>
                  </defs>

                  <polygon
                    points={`0,24 ${points} 124,24`}
                    fill={`url(#strip-area-${item.symbol})`}
                  />

                  <polyline
                    fill="none"
                    stroke={`url(#strip-line-${item.symbol})`}
                    strokeWidth="2"
                    points={points}
                  />
                </svg>
              </div>

              <div className="top-market-strip-right">
                <div className={`top-market-strip-price ${flash !== "none" ? `flash-${flash}` : ""}`}>
                  {item.price}
                </div>
                <div className={`top-market-strip-change ${item.cls}`}>
                  {item.change}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}