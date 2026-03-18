# Tander Intelligence Terminal MVP

这是一个可直接启动的 Next.js MVP 骨架，已经包含：

- 你确认过的首页视觉
- 搜索栏
- 实时情报流
- 星标收藏
- 右侧热点追踪
- 登录样式
- 全球情报网络地图
- 实时信号面板
- 本地 JSON 演示数据
- 收藏 API 与搜索 API

## 运行

```bash
npm install
npm run dev
```

打开：

```bash
http://localhost:3000
```

## 当前能力

- `/api/feed` 返回情报流
- `/api/search?q=...` 搜索情报
- `/api/favorites` 获取和切换收藏
- `/api/login` 演示登录返回

## 下一步建议

1. 把 `data/feed.json` 改成真实抓取器写入
2. 用 SQLite / PostgreSQL 替换本地 JSON
3. 加入 AI 摘要与重要度规则
4. 把城市节点绑定真实来源
