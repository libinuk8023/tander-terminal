import * as cheerio from "cheerio";

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

function cleanText(text: string | undefined | null) {
  return (text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function shorten(text: string, max = 140) {
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

function formatTime(dateStr?: string) {
  if (!dateStr) return "刚刚";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "刚刚";

  // 这里保持 UTC 显示，和你页面标题一致
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function inferImportance(title: string, summary: string): "高" | "中" {
  const text = `${title} ${summary}`.toLowerCase();

  const highKeywords = [
    "突发",
    "重磅",
    "利率",
    "降息",
    "加息",
    "非农",
    "通胀",
    "cpi",
    "ppi",
    "fomc",
    "fed",
    "财报",
    "监管",
    "收购",
    "停牌",
    "涨停",
    "跌停",
    "特朗普",
    "关税",
    "制裁",
    "央行",
    "国常会",
    "政策",
    "美联储",
  ];

  return highKeywords.some((k) => text.includes(k)) ? "高" : "中";
}

function inferTags(source: string, title: string, summary: string) {
  const text = `${source} ${title} ${summary}`.toLowerCase();
  const tags = new Set<string>();

  const chinaKeywords = [
    "a股",
    "港股",
    "沪指",
    "深成指",
    "创业板",
    "北证",
    "上证",
    "深证",
    "人民币",
    "央行",
    "财联社",
    "华尔街见闻",
    "央视",
    "cctv",
    "金十",
  ];

  const macroKeywords = [
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
    "央行",
    "经济数据",
    "美联储",
  ];

  const usStockKeywords = [
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

  if (chinaKeywords.some((k) => text.includes(k))) tags.add("中国市场");
  if (macroKeywords.some((k) => text.includes(k))) tags.add("宏观");
  if (usStockKeywords.some((k) => text.includes(k))) tags.add("美股");

  tags.add("财经");

  if (
    source.includes("财联社") ||
    source.includes("华尔街见闻") ||
    source.includes("央视")
  ) {
    tags.add("中国市场");
  }

  return Array.from(tags);
}

function absoluteUrl(url: string, base: string) {
  try {
    return new URL(url, base).toString();
  } catch {
    return "#";
  }
}

function normalizeSourceName(source: string) {
  const s = (source || "").trim();

  if (s.includes("财联社")) return "财联社";
  if (s.includes("华尔街见闻")) return "华尔街见闻";
  if (s.includes("央视") || s.toLowerCase().includes("cctv")) return "央视新闻";

  return s;
}

async function fetchHtml(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Fetch failed: ${url} ${res.status}`);
  }

  return res.text();
}

function parseCctvDateText(text: string) {
  const cleaned = cleanText(text);

  const match = cleaned.match(
    /(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})日?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/
  );

  if (!match) return undefined;

  const [, y, m, d, hh, mm, ss] = match;

  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(
    2,
    "0"
  )}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(
    ss || "00"
  ).padStart(2, "0")}+08:00`;
}

async function fetchCctvArticlePublishedAt(url: string) {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const candidates = [
      $(".info .time").first().text(),
      $(".cnt_info .time").first().text(),
      $(".title_area .info").text(),
      $(".video-info").text(),
      $("meta[name='publishdate']").attr("content"),
      $("meta[name='PubDate']").attr("content"),
      $("meta[property='article:published_time']").attr("content"),
      $("body").text(),
    ];

    for (const raw of candidates) {
      const text = cleanText(raw || "");
      const iso = parseCctvDateText(text);
      if (iso) return iso;
    }

    return undefined;
  } catch (error) {
    console.error("fetchCctvArticlePublishedAt failed:", url, error);
    return undefined;
  }
}

function makeItem(
  source: string,
  title: string,
  url: string,
  index: number,
  time?: string,
  publishedAt?: string,
  summary?: string
): SinaNewsItem {
  const finalTitle = cleanText(title);
  const finalSummary = shorten(cleanText(summary || title), 140);
  const normalizedSource = normalizeSourceName(source);

  return {
    id: Number(`${Date.now()}${index}`.slice(-12)),
    time: time || formatTime(publishedAt),
    publishedAt,
    hasKnownTime: !!time && /^\d{1,2}:\d{2}$/.test(time),
    source: normalizedSource,
    title: finalTitle,
    summary: finalSummary,
    importance: inferImportance(finalTitle, finalSummary),
    url,
    tags: inferTags(normalizedSource, finalTitle, finalSummary),
    isFavorite: false,
  };
}

async function fetchClsTelegraph(): Promise<SinaNewsItem[]> {
  const url = "https://www.cls.cn/telegraph";
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const items: SinaNewsItem[] = [];

  $(
    ".telegraph-content-box .telegraph-item, .telegraph-list .telegraph-item, .telegraph-item"
  ).each((index, el) => {
    if (items.length >= 24) return false;

    const titleNode =
      $(el).find(".telegraph-item-title").first().text() ||
      $(el).find(".telegraph-content").first().text() ||
      $(el).text();

    const title = cleanText(titleNode);
    const timeText = cleanText(
      $(el).find(".telegraph-item-time").first().text() ||
        $(el).find(".time").first().text()
    );

    if (!title || title.length < 8) return;

    const timeMatch = timeText.match(/\d{1,2}:\d{2}/);
    const time = timeMatch ? timeMatch[0] : "刚刚";

    items.push(
      makeItem("财联社", title, url, index + 100, time, undefined, title)
    );
  });

  return items;
}

async function fetchWallstreetcnNews(): Promise<SinaNewsItem[]> {
  const url = "https://wallstreetcn.com/live/global";
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const items: SinaNewsItem[] = [];

  const selectors = [
    ".live-list .live-item",
    ".live-item",
    ".news-list .item",
    ".channel-live-item",
    "article",
  ].join(",");

  $(selectors).each((index, el) => {
    if (items.length >= 24) return false;

    const title =
      cleanText($(el).find("h3").first().text()) ||
      cleanText($(el).find("h2").first().text()) ||
      cleanText($(el).find(".title").first().text()) ||
      cleanText($(el).find(".live-item-content").first().text()) ||
      cleanText($(el).find(".content").first().text()) ||
      cleanText($(el).text());

    if (!title || title.length < 8) return;

    const href = absoluteUrl($(el).find("a").first().attr("href") || "", url);

    const timeText =
      cleanText($(el).find("time").first().text()) ||
      cleanText($(el).find(".time").first().text()) ||
      cleanText($(el).find(".live-time").first().text());

    const timeMatch = timeText.match(/\d{1,2}:\d{2}/);
    const time = timeMatch ? timeMatch[0] : "刚刚";

    items.push(
      makeItem("华尔街见闻", title, href, index + 300, time, undefined, title)
    );
  });

  return items;
}

async function fetchCctvNews(): Promise<SinaNewsItem[]> {
  const url = "https://news.cctv.com/";
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const rawList: Array<{ title: string; href: string }> = [];
  const seenHref = new Set<string>();

  $("a").each((_, el) => {
    if (rawList.length >= 12) return false;

    const title = cleanText($(el).text());
    const href = absoluteUrl($(el).attr("href") || "", url);

    if (
      !title ||
      title.length < 10 ||
      href === "#" ||
      !href.includes("cctv.com")
    ) {
      return;
    }

    if (
      !(
        href.includes("/202") ||
        href.includes("/news") ||
        href.includes("/china") ||
        href.includes("/world") ||
        href.includes("/finance")
      )
    ) {
      return;
    }

    if (seenHref.has(href)) return;
    seenHref.add(href);

    rawList.push({ title, href });
  });

  const items: SinaNewsItem[] = [];

  for (let i = 0; i < rawList.length; i++) {
    const row = rawList[i];
    const publishedAt = await fetchCctvArticlePublishedAt(row.href);

    items.push(
      makeItem(
        "央视新闻",
        row.title,
        row.href,
        i + 500,
        publishedAt ? formatTime(publishedAt) : "刚刚",
        publishedAt,
        row.title
      )
    );
  }

  return items;
}

function dedupeItems(items: SinaNewsItem[]) {
  const seen = new Set<string>();
  const result: SinaNewsItem[] = [];

  for (const item of items) {
    const key = `${item.source}-${item.title}`.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function buildSortTs(item: SinaNewsItem, index: number) {
  if (item.publishedAt) {
    const ts = new Date(item.publishedAt).getTime();
    if (!Number.isNaN(ts)) return ts;
  }

  if (item.time && /^\d{1,2}:\d{2}$/.test(item.time)) {
    const now = new Date();
    const [hh, mm] = item.time.split(":").map(Number);
    const d = new Date(now);
    d.setHours(hh, mm, 0, 0);

    if (d.getTime() - now.getTime() > 5 * 60 * 1000) {
      d.setDate(d.getDate() - 1);
    }

    return d.getTime() - index;
  }

  return Date.now() - 10_000_000_000 - index;
}

function sourcePriority(source: string) {
  const normalized = normalizeSourceName(source);

  const priorityMap: Record<string, number> = {
    "财联社": 3,
    "华尔街见闻": 2,
    "央视新闻": 1,
  };

  return priorityMap[normalized] || 0;
}

export async function fetchSinaFinanceNews(): Promise<SinaNewsItem[]> {
  const results = await Promise.allSettled([
    fetchClsTelegraph(),
    fetchWallstreetcnNews(),
    fetchCctvNews(),
  ]);

  const merged = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );

  const normalized = merged.map((item, index) => {
    const title = cleanText(item.title);
    const summary = shorten(cleanText(item.summary || item.title), 140);
    const source = normalizeSourceName(item.source || "财联社");

    return {
      ...item,
      id: item.id || Number(`${Date.now()}${index}`.slice(-12)),
      source,
      title,
      summary,
      time: item.time || formatTime(item.publishedAt),
      hasKnownTime:
        typeof item.hasKnownTime === "boolean"
          ? item.hasKnownTime
          : /^\d{1,2}:\d{2}$/.test(item.time || ""),
      importance: item.importance || inferImportance(title, summary),
      tags:
        item.tags && item.tags.length
          ? item.tags
          : inferTags(source, title, summary),
      isFavorite: item.isFavorite ?? false,
      sortTs: buildSortTs(item, index),
    };
  });

  return dedupeItems(normalized).sort((a, b) => {
    const ta = a.sortTs || 0;
    const tb = b.sortTs || 0;

    if (ta !== tb) return tb - ta;
    if (a.importance !== b.importance) return a.importance === "高" ? -1 : 1;

    const pa = sourcePriority(a.source);
    const pb = sourcePriority(b.source);
    if (pa !== pb) return pb - pa;

    return a.source.localeCompare(b.source);
  });
}