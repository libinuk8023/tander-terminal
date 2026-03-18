import { NextResponse } from "next/server";

type FavouriteItem = {
  id: number;
  isFavorite: boolean;
};

export async function GET() {
  try {
    return NextResponse.json(
      {
        success: true,
        items: [] as FavouriteItem[],
        total: 0,
        message: "收藏功能暂未启用，当前仅保留图标展示。",
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("/api/favourites GET error:", error);

    return NextResponse.json(
      {
        success: false,
        items: [] as FavouriteItem[],
        total: 0,
        message: "收藏接口读取失败",
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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const id = Number(body?.id || 0);

    return NextResponse.json(
      {
        success: true,
        item: {
          id,
          isFavorite: false,
        },
        message: "收藏功能暂未启用，当前仅保留图标展示。",
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("/api/favourites POST error:", error);

    return NextResponse.json(
      {
        success: false,
        item: null,
        message: "收藏接口写入失败",
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

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id") || "0");

    return NextResponse.json(
      {
        success: true,
        item: {
          id,
          isFavorite: false,
        },
        message: "收藏功能暂未启用，当前仅保留图标展示。",
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("/api/favourites DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        item: null,
        message: "收藏接口删除失败",
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