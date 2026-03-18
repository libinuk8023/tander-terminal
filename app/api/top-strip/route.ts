import { NextResponse } from "next/server";

type StripItem = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  cls: "up" | "down";
  values: number[];
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        previousClose?: number;
        chartPreviousClose?: number;
      };
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
  { yahoo: "BTC-USD", key: "BTC", name: "BITCOIN" },
  { yahoo: "ETH-USD", key: "ETH", name: "ETHEREUM" },
  { yahoo: "SOL-USD", key: "SOL", name: "SOLANA" },
  { yahoo: "^IXIC", key: "NASDAQ", name: "NASDAQ" },
  { yahoo: "^SOX", key: "SOX", name: "PHLX SOX" },
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
  if (symbol === "BTC") return formatNumber(value, 0);
  if (symbol === "ETH") return formatNumber(value, 2);
  if (symbol === "SOL") return formatNumber(value, 3);
  if (symbol === "NASDAQ") return formatNumber(value, 0);
  if (symbol === "SOX") return formatNumber(value, 0);
  if (value >= 1000) return formatNumber(value, 0);
  if (value >= 100) return formatNumber(value, 2);
  return formatNumber(value, 3);
}

async function fetchYahooChart(symbol: string): Promise<YahooChartResponse | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1h&range=5d`;
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

async function getOne(def: { yahoo: string; key: string; name: string }): Promise<StripItem | null> {
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
  const sign = pctNum >= 0 ? "+" : "";

  return {
    symbol: def.key,
    name: def.name,
    price: normalizePrice(def.key, currentPrice),
    change: `${sign}${pctNum.toFixed(2)}%`,
    cls,
    values,
  };
}

function buildFallback(): StripItem[] {
  return [
    { symbol: "BTC", name: "BITCOIN", price: "86,420", change: "+0.00%", cls: "up", values: [16, 15, 14, 15, 16, 17, 18, 17, 18, 19, 20, 21] },
    { symbol: "ETH", name: "ETHEREUM", price: "4,820.00", change: "+0.00%", cls: "up", values: [12, 12.5, 13, 12.8, 13.4, 13.8, 14.2, 14.5, 14.9, 15.2, 15.5, 15.8] },
    { symbol: "SOL", name: "SOLANA", price: "198.400", change: "+0.00%", cls: "up", values: [10, 11, 12, 11.5, 13, 14, 15, 14.2, 15.4, 16.1, 16.8, 17.4] },
    { symbol: "NASDAQ", name: "NASDAQ", price: "21,180", change: "+0.00%", cls: "up", values: [18, 17.8, 17.6, 17.5, 17.3, 17.1, 17.0, 16.8, 16.6, 16.7, 16.9, 17.2] },
    { symbol: "SOX", name: "PHLX SOX", price: "5,214", change: "+0.00%", cls: "up", values: [14, 14.2, 14.5, 14.3, 14.8, 15.1, 15.4, 15.2, 15.6, 15.8, 16.0, 16.2] },
  ];
}

export async function GET() {
  try {
    let items: StripItem[] = [];
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

    items = result.filter(Boolean) as StripItem[];

    const fallback = items.length === 0;
    if (fallback) {
      items = buildFallback();
    }

    return NextResponse.json(
      {
        updatedAt: new Date().toISOString(),
        items,
        fallback,
        fetchErrors,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("/api/top-strip yahoo error:", error);

    return NextResponse.json(
      {
        updatedAt: new Date().toISOString(),
        items: buildFallback(),
        fallback: true,
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