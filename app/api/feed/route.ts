import { NextResponse } from "next/server";
import { getPagedNews } from "@/lib/data";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "20");

    const data = await getPagedNews(page, pageSize);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("/api/feed error:", error);

    return NextResponse.json(
      {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 1,
        items: [],
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