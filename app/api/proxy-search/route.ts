// app/api/proxy-search/route.ts

import { NextResponse } from "next/server";
import { getUULE, getGL } from "@/src/lib/uule";

export const runtime = "nodejs"; // IMPORTANT (Cloudflare + fetch safe)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q");
    const city = searchParams.get("city") || "";
    const state = searchParams.get("state") || "";
    const country = searchParams.get("country") || "";
    const page = Number(searchParams.get("page") || "0");

    if (!q) {
      return NextResponse.json(
        { error: "Missing query parameter (q)" },
        { status: 400 }
      );
    }

    // 🔒 HARD LIMIT (avoid 403)
    if (page > 10) {
      return NextResponse.json(
        { error: "Page limit exceeded (max 10)" },
        { status: 429 }
      );
    }

    const start = page * 10;

    const uule = getUULE(city, country, state);
    const gl = getGL(country) || "us";

    const googleUrl =
      `https://www.google.com/search` +
      `?q=${encodeURIComponent(q)}` +
      `&start=${start}` +
      `&num=10` +
      `&pws=0` +
      `&gl=${gl}` +
      (uule ? `&uule=${encodeURIComponent(uule)}` : "");

    const res = await fetch(googleUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      credentials: "omit",
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          error: "Google request failed",
          status: res.status,
        },
        { status: res.status }
      );
    }

    const html = await res.text();

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Server error",
        message: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
