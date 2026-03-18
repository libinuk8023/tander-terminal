import { NextResponse } from "next/server";

type LegacySignalItem = {
  name: string;
  price: string;
  change: string;
  cls: "up" | "down";
  points: string;
};

type SignalItem = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  cls: "up" | "down";
  points: string;
  values: number[];
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        previousClose?: number;
        chartPreviousClose?: number;
        currency?: string;
        symbol?: string;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
    error?: {
      code?: string;
      description?: string;
    } | null;
  };
};

const SYMBOLS = [
{ yahoo: "BTC-USD", key: "BTC", name: "BTC" },
{ yahoo: "ETH-USD", key: "ETH", name: "ETH" },
{ yahoo: "SOL-USD", key: "SOL", name: "SOL" },

{ yahoo: "NVDA", key: "NVDA", name: "NVDA" },
{ yahoo: "AAPL", key: "AAPL", name: "AAPL" },

{ yahoo: "^GSPC", key: "SP500", name: "S&P 500" },

{ yahoo: "000001.SS", key: "SSE", name: "SSE" },
{ yahoo: "399001.SZ", key: "SZSE", name: "SZSE" },
];

function safeNum(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function normalizePrice(symbol: string, value: number) {
  if (symbol === "BTC-USD") return formatNumber(value, 0);
  if (symbol === "GC=F") return formatNumber(value, 1);
  if (symbol === "^IXIC") return formatNumber(value, 0);
  if (value >= 1000) return formatNumber(value, 0);
  if (value >= 100) return formatNumber(value, 2);
  return formatNumber(value, 3);
}

function buildPoints(values: number[], width = 68, heightMin = 5, heightMax = 19) {
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((v, i) => {
      const x = 2 + (i * (width - 2)) / Math.max(values.length - 1, 1);
      const y = heightMax - ((v - min) / range) * (heightMax - heightMin);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

async function fetchYahooChart(symbol: string): Promise<YahooChartResponse | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1h&range=1d`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`${symbol} HTTP ${res.status}`);
    }

    return (await res.json()) as YahooChartResponse;
  } catch {
    return null;
  }
}

async function getOne(def: { yahoo: string; key: string; name: string }): Promise<SignalItem | null> {
  const data = await fetchYahooChart(def.yahoo);

  if (!data) {
    throw new Error(`${def.yahoo} request failed`);
  }

  if (data.chart?.error) {
    throw new Error(
      `${def.yahoo} yahoo error: ${data.chart.error.description || data.chart.error.code || "unknown error"}`
    );
  }

  const result = data.chart?.result?.[0];
  if (!result) {
    throw new Error(`${def.yahoo} no result`);
  }

  const meta = result.meta || {};
  const closesRaw = result.indicators?.quote?.[0]?.close || [];
  const values = closesRaw.map((v) => safeNum(v, NaN)).filter((n) => Number.isFinite(n));

  if (!values.length) {
    throw new Error(`${def.yahoo} no close values`);
  }

  const currentPrice =
    safeNum(meta.regularMarketPrice, 0) ||
    safeNum(values[values.length - 1], 0);

  const previousClose =
    safeNum(meta.previousClose, 0) ||
    safeNum(meta.chartPreviousClose, 0) ||
    safeNum(values[0], 0);

  const pctNum =
    previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
const cls: "up" | "down" = pctNum >= 0 ? "up" : "down";

const arrow = pctNum >= 0 ? "▲" : "▼";

return {
  symbol: def.key,
  name: def.name,
  price: normalizePrice(def.key, currentPrice),
  change: `${arrow} ${pctNum >= 0 ? "+" : ""}${pctNum.toFixed(2)}%`,
  cls,
  values,
  points: buildPoints(values),
};
}

function buildFallback(): SignalItem[] {
  const mock = [
    {
      symbol: "NVDA",
      name: "NVDA",
      price: "118.20",
      change: "+0.00%",
      cls: "up" as const,
      values: [10, 12, 14, 13, 15, 16, 17, 18, 19],
    },
    {
      symbol: "BTC-USD",
      name: "BTC",
      price: "86,420",
      change: "+0.00%",
      cls: "up" as const,
      values: [16, 15, 14, 15, 16, 17, 18, 17, 18],
    },
    {
      symbol: "GC=F",
      name: "Gold",
      price: "2,148.0",
      change: "+0.00%",
      cls: "up" as const,
      values: [12, 12.5, 13, 12.8, 13.4, 13.8, 14.2, 14.5, 14.9],
    },
    {
      symbol: "^IXIC",
      name: "NASDAQ 100",
      price: "21,180",
      change: "+0.00%",
      cls: "up" as const,
      values: [18, 17.8, 17.6, 17.5, 17.3, 17.1, 17.0, 16.8, 16.6],
    },
  ];

  return mock.map((x) => ({
    ...x,
    points: buildPoints(x.values),
  }));
}

export async function GET() {
  try {
    let items: SignalItem[] = [];
    const fetchErrors: string[] = [];

    const result = await Promise.all(
      SYMBOLS.map(async (def) => {
        try {
          return await getOne(def);
        } catch (error) {
          fetchErrors.push(error instanceof Error ? error.message : `${def.yahoo} unknown error`);
          return null;
        }
      })
    );

    items = result.filter(Boolean) as SignalItem[];

    const fallback = items.length === 0;

    if (fallback) {
      items = buildFallback();
    }

    const signals: LegacySignalItem[] = items.map((item) => ({
      name: item.name,
      price: item.price,
      change: item.change,
      cls: item.cls,
      points: item.points,
    }));

    return NextResponse.json(
      {
        updatedAt: new Date().toISOString(),
        signals,
        items,
        fallback,
        hasApiKey: false,
        fetchErrors,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("/api/signals yahoo error:", error);

    return NextResponse.json(
      {
        updatedAt: new Date().toISOString(),
        signals: [],
        items: [],
        fallback: true,
        hasApiKey: false,
        fetchErrors: [error instanceof Error ? error.message : "unknown error"],
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}