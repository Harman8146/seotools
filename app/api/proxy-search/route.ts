export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { HttpsProxyAgent } from "https-proxy-agent";


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');
  
  // Vercel will pull this from the "Environment Variables" you set in the dashboard
  const auth = process.env.PROXY_AUTH; 

  if (!auth || !targetUrl) {
    return NextResponse.json({ error: 'Missing configuration' }, { status: 400 });
  }

  try {
    const proxyUrl = `http://${auth}@p.webshare.io:80`;
    const agent = new HttpsProxyAgent(proxyUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      },
      // Note: In Vercel's Edge/Serverless runtime, fetch behavior can vary. 
      // This setup works for standard Node.js runtimes.
    });

    let html = await response.text();

    // FIXED: Inject Base Tag so Google styles don't break on your Vercel URL
    const baseTag = `<head><base href="https://www.google.com">`;
    html = html.replace('<head>', baseTag);

    return new NextResponse(html, {
      headers: { 
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store' 
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Vercel Proxy Error' }, { status: 500 });
  }
}
