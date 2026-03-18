import { NextResponse } from "next/server";
import { getPagedNews } from "@/lib/data";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "20");

    const data = await getPagedNews(page, pageSize);

    console.log("/api/feed data debug:", {
      total: data.total,
      totalPages: data.totalPages,
      itemCount: data.items?.length || 0,
    });

    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        {
          page: 1,
          pageSize: 20,
          total: 2,
          totalPages: 1,
          items: [
            {
              id: 1,
              time: "21:01",
              source: "System",
              title: "Feed fallback is active",
              summary: "The API route is working, but upstream live sources returned no items.",
              importance: "中",
              url: "#",
              tags: ["系统", "调试"],
              isFavorite: false,
            },
            {
              id: 2,
              time: "20:54",
              source: "System",
              title: "RSS or source debugging is still needed",
              summary: "Next step is to inspect Reuters and Bloomberg RSS results in Vercel logs.",
              importance: "高",
              url: "#",
              tags: ["部署", "调试"],
              isFavorite: false,
            },
          ],
        },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("/api/feed error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        page: 1,
        pageSize: 20,
        total: 2,
        totalPages: 1,
        items: [
          {
            id: 1,
            time: "21:01",
            source: "System",
            title: "Feed route catch fallback is active",
            summary: "The route threw an error before getPagedNews could finish.",
            importance: "高",
            url: "#",
            tags: ["系统", "报错"],
            isFavorite: false,
          },
          {
            id: 2,
            time: "20:54",
            source: "System",
            title: error instanceof Error ? error.message : "Unknown error",
            summary: "Check Vercel function logs for the full stack trace.",
            importance: "中",
            url: "#",
            tags: ["调试", "错误"],
            isFavorite: false,
          },
        ],
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}