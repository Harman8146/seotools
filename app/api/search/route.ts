import { NextResponse } from "next/server";
import { getUULE, getGL } from "../../../src/lib/uule";
import * as cheerio from "cheerio";

const SERP_KEYS = process.env.SERPAPI_KEYS
  ? process.env.SERPAPI_KEYS.split(",")
  : [];

let serpIndex = 0;
const nextSerpKey = () => SERP_KEYS[serpIndex++ % SERP_KEYS.length];

const CSE_KEY = process.env.GOOGLE_CSE_KEY!;
const CSE_CX = process.env.GOOGLE_CSE_CX!;

/* ─────────────────────────────
   Google HTML Scraper (LAST)
───────────────────────────── */
async function searchGoogleHTML(q: string, uule: string, gl: string, page: number) {
  const start = (page - 1) * 10;
  const url =
    `https://www.google.com/search` +
    `?q=${encodeURIComponent(q)}` +
    `&uule=${encodeURIComponent(uule)}` +
    `&gl=${gl}&hl=en&start=${start}`;

  const res = await fetch(url, {
    credentials: "omit",
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      "accept-language": "en-US,en;q=0.9",
    },
  });

  const html = await res.text();
  const $ = cheerio.load(html);
  const results: any[] = [];

  $("div.g").each((_, el) => {
    const title = $(el).find("h3").text();
    const link = $(el).find("a").attr("href");
    const snippet = $(el).find("div.VwiC3b").text();
    if (title && link) results.push({ title, link, displayed_link: link, snippet });
  });

  return results;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const location = searchParams.get("location") || "";
    const page = Number(searchParams.get("page") || "1");

    if (!q || !location) {
      return NextResponse.json({ error: "Missing input" });
    }

    const [city, state, country] = location.split(",").map(s => s.trim());
    const uule = getUULE(city, country, state);
    const gl = getGL(country);

    if (!uule) {
      return NextResponse.json({ error: "UULE not found" });
    }

    const start = (page - 1) * 10;

    /* ─────────────────────────────
       1️⃣ SERPAPI (BEST — full rich data)
    ───────────────────────────── */
    try {
      const serpUrl =
        `https://serpapi.com/search.json` +
        `?engine=google` +
        `&q=${encodeURIComponent(q)}` +
        `&uule=${encodeURIComponent(uule)}` +
        `&hl=en&gl=${gl}` +
        `&start=${start}` +
        `&api_key=${nextSerpKey()}`;

      const serpRes = await fetch(serpUrl, { credentials: "omit" });
      const serpJson = await serpRes.json();

      if (serpJson.organic_results?.length) {
        return NextResponse.json({
          source: "serpapi",
          q,
          location,
          page,
          // ── Main results
          organic_results: serpJson.organic_results.map((r: any) => ({
            position: r.position,
            title: r.title,
            link: r.link,
            displayed_link: r.displayed_link || r.link,
            snippet: r.snippet || "",
            favicon: r.favicon,
            thumbnail: r.thumbnail,
            sitelinks: r.sitelinks,
          })),
          // ── Local map pack
          local_results: serpJson.local_results || null,
          // ── Knowledge graph (right panel)
          knowledge_graph: serpJson.knowledge_graph || null,
          // ── People Also Ask
          related_questions: serpJson.related_questions || [],
          // ── Related searches
          related_searches: serpJson.related_searches || [],
          // ── Search stats
          search_information: serpJson.search_information || null,
          // ── Things to know
          things_to_know: serpJson.things_to_know || null,
        });
      }
    } catch {}

    /* ─────────────────────────────
       2️⃣ GOOGLE CSE (FALLBACK — organic only)
    ───────────────────────────── */
    try {
      const cseUrl =
        `https://www.googleapis.com/customsearch/v1` +
        `?key=${CSE_KEY}` +
        `&cx=${CSE_CX}` +
        `&q=${encodeURIComponent(q)}` +
        `&start=${start + 1}`;

      const cseRes = await fetch(cseUrl, { credentials: "omit" });
      const cseJson = await cseRes.json();

      if (cseJson.items?.length) {
        return NextResponse.json({
          source: "google_cse",
          q,
          location,
          page,
          organic_results: cseJson.items.map((i: any) => ({
            title: i.title,
            link: i.link,
            displayed_link: i.displayLink,
            snippet: i.snippet,
            favicon: `https://www.google.com/s2/favicons?domain=${i.displayLink}&sz=32`,
          })),
          local_results: null,
          knowledge_graph: null,
          related_questions: [],
          related_searches: [],
          search_information: null,
        });
      }
    } catch {}

    /* ─────────────────────────────
       3️⃣ GOOGLE HTML (LAST RESORT)
    ───────────────────────────── */
    const htmlResults = await searchGoogleHTML(q, uule, gl, page);

    return NextResponse.json({
      source: "google_html",
      q,
      location,
      page,
      organic_results: htmlResults,
      local_results: null,
      knowledge_graph: null,
      related_questions: [],
      related_searches: [],
      search_information: null,
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}