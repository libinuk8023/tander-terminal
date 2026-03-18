import fs from "fs";
import path from "path";
import { fetchSinaFinanceNews } from "../lib/fetchSinaFinance";

async function main() {

  const news = await fetchSinaFinanceNews();

  const outputPath = path.join(process.cwd(), "data", "feed.json");

  fs.writeFileSync(outputPath, JSON.stringify(news, null, 2));

  console.log(`成功抓取 ${news.length} 条新浪财经新闻`);
}

main();