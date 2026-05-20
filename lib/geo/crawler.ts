import * as cheerio from "cheerio";

export type Heading = {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
};

export type ExtractedPage = {
  url: string;
  status: number;
  title: string;
  metaDescription: string;
  headings: Heading[];
  schemaMarkup: string[];
  faqContent: string[];
  internalLinks: string[];
  canonicalUrl: string;
  robotsMeta: string;
  jsonLd: unknown[];
  tables: string[];
  lists: string[];
  authorSignals: string[];
  contactSignals: string[];
  aboutSignals: string[];
  textContent: string;
  wordCount: number;
};

export type CrawlTechnicalFindings = {
  crawledPages: number;
  skippedByRobots: string[];
  failedPages: Array<{ url: string; status?: number; error: string }>;
  robotsTxt: {
    found: boolean;
    url: string;
    crawlDelayMs: number;
  };
  llmsTxt: {
    found: boolean;
    url: string;
    status?: number;
  };
};

export type GeoCrawlResult = {
  startUrl: string;
  origin: string;
  pages: ExtractedPage[];
  technicalFindings: CrawlTechnicalFindings;
};

type RobotsRules = {
  allow: string[];
  disallow: string[];
  crawlDelayMs?: number;
};

type CheerioElement = {
  tagName: string;
};

type CheerioSelection = {
  attr(name: string): string | undefined;
  each(callback: (index: number, element: CheerioElement) => void): CheerioSelection;
  filter(callback: (index: number, element: CheerioElement) => boolean): CheerioSelection;
  first(): CheerioSelection;
  html(): string | null;
  map<T>(callback: (index: number, element: CheerioElement) => T): { get(): T[] };
  next(selector?: string): CheerioSelection;
  remove(): CheerioSelection;
  text(): string;
  toArray(): CheerioElement[];
};

type CheerioRoot = {
  (selector: string | CheerioElement): CheerioSelection;
};

const MAX_INTERNAL_PAGES = 10;
const REQUEST_TIMEOUT_MS = 9000;
const DEFAULT_DELAY_MS = 900;
const MAX_RETRIES = 2;
const MAX_HTML_BYTES = 1_500_000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 GEOAuditBot/1.0";

const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

export async function crawlGeoSite(inputUrl: string): Promise<GeoCrawlResult> {
  const startUrl = normalizeInputUrl(inputUrl);
  assertPublicHttpUrl(startUrl);

  const origin = startUrl.origin;
  const robotsUrl = new URL("/robots.txt", origin).toString();
  const llmsUrl = new URL("/llms.txt", origin).toString();
  const robots = await fetchRobots(robotsUrl);
  const llms = await checkLlmsTxt(llmsUrl);
  const delayMs = Math.max(robots.crawlDelayMs ?? DEFAULT_DELAY_MS, DEFAULT_DELAY_MS);

  const queue = [canonicalizeUrl(startUrl)];
  const queued = new Set(queue);
  const visited = new Set<string>();
  const pages: ExtractedPage[] = [];
  const skippedByRobots: string[] = [];
  const failedPages: CrawlTechnicalFindings["failedPages"] = [];

  while (queue.length > 0 && pages.length < MAX_INTERNAL_PAGES) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);
    const currentUrl = new URL(current);

    if (!isAllowedByRobots(currentUrl, robots)) {
      skippedByRobots.push(current);
      continue;
    }

    if (pages.length > 0) {
      await delay(delayMs);
    }

    try {
      const response = await fetchWithRetry(current);
      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok) {
        failedPages.push({ url: current, status: response.status, error: "Request failed" });
        continue;
      }

      if (!contentType.includes("text/html")) {
        failedPages.push({ url: current, status: response.status, error: "Not an HTML page" });
        continue;
      }

      const html = await readLimitedText(response);
      const extracted = extractPageData(current, html, origin);
      extracted.status = response.status;
      pages.push(extracted);

      for (const link of extracted.internalLinks) {
        if (pages.length + queue.length >= MAX_INTERNAL_PAGES) {
          break;
        }
        if (!visited.has(link) && !queued.has(link)) {
          queue.push(link);
          queued.add(link);
        }
      }
    } catch (error) {
      failedPages.push({
        url: current,
        error: error instanceof Error ? error.message : "Unknown crawl error",
      });
    }
  }

  return {
    startUrl: startUrl.toString(),
    origin,
    pages,
    technicalFindings: {
      crawledPages: pages.length,
      skippedByRobots,
      failedPages,
      robotsTxt: {
        found: robots.found,
        url: robotsUrl,
        crawlDelayMs: delayMs,
      },
      llmsTxt: llms,
    },
  };
}

function extractPageData(url: string, html: string, origin: string): ExtractedPage {
  const $ = cheerio.load(html) as unknown as CheerioRoot;

  $("script, style, noscript, svg, canvas, iframe").remove();

  const title = cleanText($("title").first().text());
  const metaDescription = cleanText($('meta[name="description"]').attr("content") ?? "");
  const canonicalUrl = absolutizeUrl($('link[rel="canonical"]').attr("href") ?? "", url);
  const robotsMeta = cleanText($('meta[name="robots"]').attr("content") ?? "");
  const headings = $("h1,h2,h3,h4,h5,h6")
    .toArray()
    .map((element) => ({
      level: Number(element.tagName.slice(1)) as Heading["level"],
      text: cleanText($(element).text()),
    }))
    .filter((heading: Heading) => heading.text.length > 0);

  const schemaMarkup = $('[itemscope], [itemtype], [typeof], [property^="schema:"]')
    .toArray()
    .map((element) => cleanText($(element).attr("itemtype") ?? $(element).attr("typeof") ?? $(element).text()))
    .filter((value: string) => Boolean(value))
    .slice(0, 50);

  const jsonLd = $('script[type="application/ld+json"]')
    .toArray()
    .map((element) => parseJsonLd($(element).html() ?? ""))
    .filter((value): value is unknown => value !== null);

  const faqContent = extractFaqContent($);
  const internalLinks = extractInternalLinks($, url, origin);
  const tables = $("table")
    .toArray()
    .map((element) => cleanText($(element).text()))
    .filter((text: string) => Boolean(text))
    .slice(0, 20);
  const lists = $("ul,ol")
    .toArray()
    .map((element) => cleanText($(element).text()))
    .filter((text) => text.split(" ").length >= 4)
    .slice(0, 40);
  const bodyText = cleanText($("body").text());
  const signalText = [bodyText, title, metaDescription, headings.map((heading) => heading.text).join(" ")].join(" ");

  return {
    url,
    status: 0,
    title,
    metaDescription,
    headings,
    schemaMarkup,
    faqContent,
    internalLinks,
    canonicalUrl,
    robotsMeta,
    jsonLd,
    tables,
    lists,
    authorSignals: collectSignals(signalText, /\b(author|written by|reviewed by|editor|expert|byline|profile)\b/gi),
    contactSignals: collectSignals(signalText, /\b(contact|email|phone|support|address|customer service)\b/gi),
    aboutSignals: collectSignals(signalText, /\b(about us|about|mission|team|company|organization|who we are)\b/gi),
    textContent: bodyText,
    wordCount: countWords(bodyText),
  };
}

async function fetchRobots(url: string): Promise<RobotsRules & { found: boolean }> {
  try {
    const response = await fetchWithTimeout(url, { timeoutMs: REQUEST_TIMEOUT_MS });
    if (!response.ok) {
      return { found: false, allow: [], disallow: [] };
    }

    const text = await response.text();
    return { found: true, ...parseRobotsTxt(text) };
  } catch {
    return { found: false, allow: [], disallow: [] };
  }
}

async function checkLlmsTxt(url: string): Promise<CrawlTechnicalFindings["llmsTxt"]> {
  try {
    const response = await fetchWithTimeout(url, { timeoutMs: REQUEST_TIMEOUT_MS });
    return { found: response.ok, url, status: response.status };
  } catch {
    return { found: false, url };
  }
}

function parseRobotsTxt(text: string): RobotsRules {
  const rules: RobotsRules = { allow: [], disallow: [] };
  let applies = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line) {
      continue;
    }

    const [rawKey, ...rawValue] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.join(":").trim();

    if (key === "user-agent") {
      const agent = value.toLowerCase();
      applies = agent === "*" || agent.includes("geoauditbot");
      continue;
    }

    if (!applies) {
      continue;
    }

    if (key === "allow" && value) {
      rules.allow.push(value);
    }
    if (key === "disallow" && value) {
      rules.disallow.push(value);
    }
    if (key === "crawl-delay") {
      const seconds = Number(value);
      if (Number.isFinite(seconds) && seconds > 0) {
        rules.crawlDelayMs = Math.min(seconds * 1000, 5000);
      }
    }
  }

  return rules;
}

function isAllowedByRobots(url: URL, rules: RobotsRules): boolean {
  const path = `${url.pathname}${url.search}`;
  const longestAllow = longestMatchingRule(path, rules.allow);
  const longestDisallow = longestMatchingRule(path, rules.disallow);

  if (!longestDisallow) {
    return true;
  }

  return longestAllow.length >= longestDisallow.length;
}

function longestMatchingRule(path: string, rules: string[]): string {
  return rules
    .filter((rule) => rule === "/" || path.startsWith(rule))
    .sort((a, b) => b.length - a.length)[0] ?? "";
}

async function fetchWithRetry(url: string): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, { timeoutMs: REQUEST_TIMEOUT_MS });
      if (![403, 408, 429, 500, 502, 503, 504].includes(response.status) || attempt === MAX_RETRIES) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES) {
        throw error;
      }
    }

    await delay(DEFAULT_DELAY_MS * (attempt + 1));
  }

  throw lastError instanceof Error ? lastError : new Error("Fetch retry failed");
}

async function fetchWithTimeout(url: string, options: { timeoutMs: number }): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    return await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
      credentials: "omit",
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function readLimitedText(response: Response): Promise<string> {
  const text = await response.text();
  return text.length > MAX_HTML_BYTES ? text.slice(0, MAX_HTML_BYTES) : text;
}

function extractInternalLinks($: CheerioRoot, pageUrl: string, origin: string): string[] {
  const links = new Set<string>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href") ?? "";
    const normalized = normalizeCrawlUrl(href, pageUrl, origin);
    if (normalized) {
      links.add(normalized);
    }
  });

  return Array.from(links).slice(0, 80);
}

function extractFaqContent($: CheerioRoot): string[] {
  const faq: string[] = [];
  const questionPattern = /\b(who|what|when|where|why|how|can|does|do|is|are|should|will)\b.+\?/i;

  $("h2,h3,h4,dt,summary,strong,p").each((_, element) => {
    const text = cleanText($(element).text());
    if (questionPattern.test(text)) {
      const answer = cleanText($(element).next("p,dd,div").text());
      faq.push(answer ? `${text} ${answer}` : text);
    }
  });

  return Array.from(new Set(faq)).slice(0, 30);
}

function normalizeInputUrl(input: string): URL {
  const trimmed = input.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return new URL(withProtocol);
}

function normalizeCrawlUrl(href: string, pageUrl: string, origin: string): string | null {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return null;
  }

  try {
    const url = new URL(href, pageUrl);
    if (url.origin !== origin || !["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return canonicalizeUrl(url);
  } catch {
    return null;
  }
}

function canonicalizeUrl(url: URL): string {
  url.hash = "";
  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url.toString();
}

function absolutizeUrl(value: string, baseUrl: string): string {
  if (!value) {
    return "";
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
}

function assertPublicHttpUrl(url: URL): void {
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }

  const hostname = url.hostname.toLowerCase();
  if (
    BLOCKED_HOSTS.has(hostname) ||
    hostname.endsWith(".local") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  ) {
    throw new Error("Private or local URLs are not allowed");
  }
}

function parseJsonLd(raw: string): unknown | null {
  try {
    return JSON.parse(raw.trim());
  } catch {
    return null;
  }
}

function collectSignals(text: string, pattern: RegExp): string[] {
  return Array.from(text.matchAll(pattern))
    .map((match) => cleanText(match[0]))
    .filter(Boolean)
    .slice(0, 12);
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
