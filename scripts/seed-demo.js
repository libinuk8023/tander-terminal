const fs = require("fs");
const path = require("path");

const feed = [
  {
    id: 1,
    time: "10:42",
    source: "金十数据",
    title: "宏观数据公布前市场波动扩大",
    summary: "AI摘要：关注美元指数与美债收益率，短线风险偏好可能切换。",
    importance: "高"
  },
  {
    id: 2,
    time: "10:36",
    source: "Bloomberg",
    title: "机构重新评估全球利率路径",
    summary: "AI摘要：利率预期变化会直接影响成长股估值和美元定价。",
    importance: "高"
  },
  {
    id: 3,
    time: "10:28",
    source: "华尔街见闻",
    title: "AI芯片板块继续成为市场主线",
    summary: "AI摘要：算力需求叙事持续强化，适合归入 AI 洞察主线。",
    importance: "高"
  },
  {
    id: 4,
    time: "10:20",
    source: "同花顺",
    title: "科技股情绪回暖，市场关注成长风格修复",
    summary: "AI摘要：情绪修复正在扩散，适合与A股、港股科技线一起观察。",
    importance: "中"
  }
];
const favorites = [feed[1], feed[2]];

fs.writeFileSync(path.join(process.cwd(), "data", "feed.json"), JSON.stringify(feed, null, 2), "utf8");
fs.writeFileSync(path.join(process.cwd(), "data", "favorites.json"), JSON.stringify(favorites, null, 2), "utf8");

console.log("Demo data written.");
