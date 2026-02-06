import { NextResponse } from 'next/server';
import { HttpsProxyAgent } from 'https-proxy-agent';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');
  const auth = process.env.PROXY_AUTH; // Managed in Vercel Dashboard

  if (!auth || !targetUrl) return NextResponse.json({ error: 'Config Missing' }, { status: 400 });

  try {
    const proxyUrl = `http://${auth}@p.webshare.io:80`;
    const agent = new HttpsProxyAgent(proxyUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...' },
    });

    let html = await response.text();
    // Injects <base> so images load from Google
    const baseTag = `<head><base href="https://www.google.com">`;
    html = html.replace('<head>', baseTag);

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (err) {
    return NextResponse.json({ error: 'Proxy Failed' }, { status: 500 });
  }
}
