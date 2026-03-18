import Parser from "rss-parser";
import { fetchSinaFinanceNews } from "./fetchSinaFinance";

export type SinaNewsItem = {
  id: number;
  time: string;
  publishedAt?: string;
  hasKnownTime?: boolean;
  source: string;
  title: string;
  summary: string;
  importance: "高" | "中";
  url: string;
  tags?: string[];
  isFavorite?: boolean;
  sortTs?: number;
};

const parser = new Parser({
  timeout: 10000,
});

const HIGH_KEYWORDS = [
  "breaking",
  "urgent",
  "live",
  "fomc",
  "fed",
  "cpi",
  "ppi",
  "nonfarm",
  "powell",
  "rate cut",
  "tariff",
  "sanction",
  "earnings",
  "guidance",
  "sec",
  "bitcoin etf",
  "hack",
  "liquidation",
  "爆",
  "突发",
  "重磅",
  "利率",
  "降息",
  "加息",
  "非农",
  "通胀",
  "财报",
  "监管",
  "清算",
  "比特币etf",
  "特朗普",
];

const CHINA_KEYWORDS = [
  "a股",
  "港股",
  "沪指",
  "深成指",
  "创业板",
  "北证",
  "上证",
  "深证",
  "人民币",
  "财联社",
  "华尔街见闻",
  "央视",
  "cctv",
  "金十",
];

const MACRO_KEYWORDS = [
  "fed",
  "fomc",
  "ecb",
  "boj",
  "boe",
  "cpi",
  "ppi",
  "inflation",
  "payroll",
  "gdp",
  "pce",
  "利率",
  "通胀",
  "非农",
  "宏观",
  "美元",
  "美债",
  "国债",
];

const US_STOCK_KEYWORDS = [
  "nasdaq",
  "s&p",
  "dow",
  "apple",
  "microsoft",
  "nvidia",
  "tesla",
  "meta",
  "amazon",
  "google",
  "美股",
  "纳指",
  "标普",
  "科技股",
  "英伟达",
  "特斯拉",
];

const ALLOWED_SOURCES = [
  "财联社",
  "金十",
  "华尔街见闻",
  "央视新闻",
  "Reuters",
  "Bloomberg",
  "新浪财经",
  "新浪新闻",
] as const;

const RSS_SOURCES = [
  {
    key: "jin10",
    source: "金十",
    url: "https://rsshub.app/jin10",
  },
  {
    key: "reuters",
    source: "Reuters",
    url: "https://feeds.reuters.com/reuters/businessNews",
  },
  {
    key: "bloomberg",
    source: "Bloomberg",
    url: "https://feeds.bloomberg.com/markets/news.rss",
  },
] as const;

function cleanText(text?: string | null) {
  return (text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(text: string) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function normalizeText(text?: string | null) {
  return decodeHtml(cleanText(text));
}

function shorten(text: string, max = 120) {
  if (!text) return "";
  return text.length <= max ? text : `${text.slice(0, max).trim()}...`;
}

function formatTime(dateStr?: string) {
  if (!dateStr) return "刚刚";

  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "刚刚";

  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function includesAny(text: string, keywords: readonly string[]) {
  return keywords.some((k) => text.includes(k));
}

function inferImportance(title: string, summary: string): "高" | "中" {
  const text = `${title} ${summary}`.toLowerCase();
  return includesAny(text, HIGH_KEYWORDS) ? "高" : "中";
}

function inferTags(source: string, title: string, summary: string) {
  const text = `${source} ${title} ${summary}`.toLowerCase();
  const tags = new Set<string>();

  if (includesAny(text, CHINA_KEYWORDS)) tags.add("中国市场");
  if (includesAny(text, MACRO_KEYWORDS)) tags.add("宏观");
  if (includesAny(text, US_STOCK_KEYWORDS)) tags.add("美股");

  if (
    source.includes("财联社") ||
    source.includes("金十") ||
    source.includes("华尔街见闻") ||
    source.includes("央视")
  ) {
    tags.add("中国市场");
    tags.add("财经");
  }

  if (source.includes("Reuters") || source.includes("Bloomberg")) {
    tags.add("全球市场");
    tags.add("财经");
  }

  return Array.from(tags);
}

function normalizeSourceName(source: string) {
  const s = (source || "").trim();

  if (s.includes("财联社")) return "财联社";
  if (s.includes("金十")) return "金十";
  if (s.includes("华尔街见闻")) return "华尔街见闻";
  if (s.includes("央视") || s.toLowerCase().includes("cctv")) return "央视新闻";
  if (s.includes("新浪财经")) return "新浪财经";
  if (s.includes("新浪新闻")) return "新浪新闻";
  if (s.toLowerCase().includes("reuters")) return "Reuters";
  if (s.toLowerCase().includes("bloomberg")) return "Bloomberg";

  return s;
}

function isAllowedSource(source: string) {
  return ALLOWED_SOURCES.includes(
    normalizeSourceName(source) as (typeof ALLOWED_SOURCES)[number]
  );
}

function buildNewsItem(
  raw: Partial<SinaNewsItem> & {
    source: string;
    title: string;
    summary?: string;
    url?: string;
    publishedAt?: string;
  },
  index: number
): SinaNewsItem {
  const title = normalizeText(raw.title);
  const summary = shorten(normalizeText(raw.summary || title), 140);
  const publishedAt = raw.publishedAt;
  const normalizedSource = normalizeSourceName(raw.source);

  return {
    id: raw.id || Number(`${Date.now()}${index}`.slice(-12)),
    time: raw.time || formatTime(publishedAt),
    publishedAt,
    hasKnownTime: raw.hasKnownTime ?? !!publishedAt,
    source: normalizedSource,
    title,
    summary,
    importance: raw.importance || inferImportance(title, summary),
    url: raw.url || "#",
    tags:
      raw.tags && raw.tags.length
        ? raw.tags
        : inferTags(normalizedSource, title, summary),
    isFavorite: raw.isFavorite ?? false,
    sortTs: raw.sortTs,
  };
}

function dedupeItems(items: SinaNewsItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.source}-${item.title}`.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchRssItems(
  url: string,
  sourceName: string
): Promise<SinaNewsItem[]> {
  try {
    const feed = await parser.parseURL(url);
    const items = Array.isArray(feed.items) ? feed.items : [];

    return items
      .map((item, index) =>
        buildNewsItem(
          {
            source: sourceName,
            title: item.title || "",
            summary:
              (item.contentSnippet as string) ||
              (item.content as string) ||
              (item.summary as string) ||
              "",
            publishedAt:
              (item.isoDate as string) ||
              (item.pubDate as string) ||
              undefined,
            url: (item.link as string) || "#",
          },
          index
        )
      )
      .filter((item) => item.title && isAllowedSource(item.source));
  } catch (error) {
    console.error(`RSS fetch failed for ${sourceName}:`, error);
    return [];
  }
}

async function fetchExtraRssNews() {
  const results = await Promise.allSettled(
    RSS_SOURCES.map((item) => fetchRssItems(item.url, item.source))
  );

  return results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );
}

function sourcePriority(source: string) {
  const normalized = normalizeSourceName(source);

  const priorityMap: Record<string, number> = {
    "财联社": 6,
    "金十": 5,
    Reuters: 4,
    Bloomberg: 3,
    "华尔街见闻": 2,
    "央视新闻": 1,
  };

  return priorityMap[normalized] || 0;
}

function sortNews(items: SinaNewsItem[]) {
  return [...items].sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;

    if (ta !== tb) return tb - ta;
    if (a.importance !== b.importance) return a.importance === "高" ? -1 : 1;

    const pa = sourcePriority(a.source);
    const pb = sourcePriority(b.source);
    if (pa !== pb) return pb - pa;

    return a.source.localeCompare(b.source);
  });
}

export async function getMergedNews(): Promise<SinaNewsItem[]> {
  const [sinaResult, extraResult] = await Promise.allSettled([
    fetchSinaFinanceNews(),
    fetchExtraRssNews(),
  ]);

  const sinaItems =
    sinaResult.status === "fulfilled" ? sinaResult.value : [];
  const extraItems =
    extraResult.status === "fulfilled" ? extraResult.value : [];

  if (sinaResult.status === "rejected") {
    console.error("fetchSinaFinanceNews failed:", sinaResult.reason);
  }

  if (extraResult.status === "rejected") {
    console.error("fetchExtraRssNews failed:", extraResult.reason);
  }

  const merged = [...sinaItems, ...extraItems];
  const normalized = merged
    .map((item, index) => buildNewsItem(item, index))
    .filter((item) => isAllowedSource(item.source));

  console.log("getMergedNews debug:", {
    sinaCount: sinaItems.length,
    extraCount: extraItems.length,
    mergedCount: merged.length,
    normalizedCount: normalized.length,
  });

  return sortNews(dedupeItems(normalized));
}

export async function getPagedNews(page = 1, pageSize = 20) {
  const items = await getMergedNews();
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Math.min(200, Number(pageSize) || 20));

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const currentPage = Math.min(safePage, totalPages);
  const start = (currentPage - 1) * safePageSize;
  const end = start + safePageSize;

  return {
    page: currentPage,
    pageSize: safePageSize,
    total,
    totalPages,
    items: items.slice(start, end),
  };
}

export async function searchNews(query: string) {
  const q = query.trim().toLowerCase();
  const items = await getMergedNews();

  if (!q) {
    return {
      query: "",
      results: items,
    };
  }

  const results = items.filter((item) => {
    const text =
      `${item.title} ${item.summary} ${item.source} ${(item.tags || []).join(" ")}`.toLowerCase();
    return text.includes(q);
  });

  return {
    query,
    results,
  };
}