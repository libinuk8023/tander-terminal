import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "V3_DEPLOY_TEST",
    message: "If you see this, Vercel is using your latest code",
    items: [
      {
        id: 1,
        time: "NOW",
        source: "TEST",
        title: "DEPLOY SUCCESS",
        summary: "This confirms your Vercel deployment is correct.",
        importance: "高",
        url: "#",
      },
    ],
  });
}