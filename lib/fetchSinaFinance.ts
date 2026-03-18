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

export async function fetchSinaFinanceNews(): Promise<SinaNewsItem[]> {
  console.log("fetchSinaFinanceNews disabled: using RSS-only fallback on deployment");
  return [];
}