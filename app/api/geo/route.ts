import { NextResponse } from "next/server";
import { analyzeGeo } from "@/lib/geo/geo-analyzer";
import { crawlGeoSite } from "@/lib/geo/crawler";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json({ error: "Missing required field: url" }, { status: 400 });
    }

    const crawl = await crawlGeoSite(url);

    if (crawl.pages.length === 0) {
      return NextResponse.json(
        {
          error: "No crawlable HTML pages found",
          technicalFindings: crawl.technicalFindings,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(analyzeGeo(crawl), { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "GEO analysis failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing query parameter: url" }, { status: 400 });
  }

  return POST(
    new Request(request.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    })
  );
}
