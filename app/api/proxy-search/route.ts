export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ProxyAgent, fetch } from "undici";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const proxyUrl = `http://${process.env.WEBSHARE_USER}:${process.env.WEBSHARE_PASS}@p.webshare.io:80`;

  const agent = new ProxyAgent(proxyUrl);

  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}&num=10`;

  const res = await fetch(googleUrl, {
    dispatcher: agent,
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      "accept-language": "en-US,en;q=0.9",
    },
  });

  const html = await res.text();

  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}
