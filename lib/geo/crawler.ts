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
  schemaTypes: string[];
  schemaDetection: SchemaDetectionResult;
  tables: string[];
  lists: string[];
  paragraphs: string[];
  images: {
    total: number;
    missingAlt: number;
  };
  openGraph: Record<string, string>;
  twitterCard: Record<string, string>;
  authorSignals: string[];
  contactSignals: string[];
  aboutSignals: string[];
  trustSignals: string[];
  socialProofSignals: string[];
  freshnessSignals: string[];
  externalLinks: string[];
  textContent: string;
  wordCount: number;
};

export type SchemaDetectionResult = {
  schemaDetected: boolean;
  schemaTypes: string[];
  schemaCount: number;
  faqSchema: boolean;
  organizationSchema: boolean;
  productSchema: boolean;
  localBusinessSchema: boolean;
  breadcrumbSchema: boolean;
  articleSchema: boolean;
  websiteSchema: boolean;
  serviceSchema: boolean;
  personSchema: boolean;
  reviewSchema: boolean;
  aggregateRatingSchema: boolean;
  jsonLdBlocks: number;
  jsonLdValidBlocks: number;
  jsonLdInvalidBlocks: number;
  microdataItems: number;
  rdfaItems: number;
  invalidSchemaWarnings: string[];
  incompleteFields: string[];
  missingRecommendedSchema: string[];
  recommendations: string[];
};

export type CrawlTechnicalFindings = {
  crawledPages: number;
  skippedByRobots: string[];
  failedPages: Array<{ url: string; status?: number; error: string }>;
  robotsTxt: {
    found: boolean;
    url: string;
    crawlDelayMs: number;
    aiCrawlerAccess: AiCrawlerAccess[];
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

export type AiCrawlerAccess = {
  crawler: "GPTBot" | "ClaudeBot" | "PerplexityBot" | "Google-Extended" | "CCBot" | "Bytespider";
  status: "allowed" | "blocked" | "partially restricted";
  matchedRules: string[];
};

type ParsedRobots = RobotsRules & {
  found: boolean;
  groups: Array<{ agents: string[]; allow: string[]; disallow: string[] }>;
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
const DEFAULT_DELAY_MS = 250;
const MAX_RETRIES = 2;
const MAX_HTML_BYTES = 1_500_000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 GEOAuditBot/1.0";
const COMMON_SCHEMA_TYPES = [
  "FAQPage",
  "LocalBusiness",
  "Product",
  "Article",
  "BreadcrumbList",
  "Organization",
  "WebSite",
  "Service",
  "Person",
  "Review",
  "AggregateRating",
];

const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

export async function crawlGeoSite(inputUrl: string): Promise<GeoCrawlResult> {
  const startUrl = normalizeInputUrl(inputUrl);
  assertPublicHttpUrl(startUrl);

  const origin = startUrl.origin;
  const robotsUrl = new URL("/robots.txt", origin).toString();
  const llmsUrl = new URL("/llms.txt", origin).toString();
  const [robots, llms] = await Promise.all([fetchRobots(robotsUrl), checkLlmsTxt(llmsUrl)]);
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
      debugSchemaLog("Fetched HTML", { url: current, length: html.length });
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
        aiCrawlerAccess: analyzeAiCrawlerAccess(startUrl, robots),
      },
      llmsTxt: llms,
    },
  };
}

function extractPageData(url: string, html: string, origin: string): ExtractedPage {
  const $ = cheerio.load(html) as unknown as CheerioRoot;

  const schemaDetection = detectSchemaMarkup($, html, url);
  const jsonLd = schemaDetectionJsonLd($, html);
  const schemaMarkup = extractSemanticSchemaMarkup($);
  const schemaTypes = Array.from(new Set([...schemaDetection.schemaTypes, ...extractSchemaTypes(jsonLd, schemaMarkup)])).sort();

  $("script, style, noscript, svg, canvas, iframe").remove();

  const title = cleanText($("title").first().text());
  const metaDescription = cleanText($('meta[name="description"]').attr("content") ?? "");
  const canonicalUrl = absolutizeUrl($('link[rel="canonical"]').attr("href") ?? "", url);
  const robotsMeta = cleanText($('meta[name="robots"]').attr("content") ?? "");
  const openGraph = extractMetaMap($, 'meta[property^="og:"]', "property");
  const twitterCard = extractMetaMap($, 'meta[name^="twitter:"]', "name");
  const headings = $("h1,h2,h3,h4,h5,h6")
    .toArray()
    .map((element) => ({
      level: Number(element.tagName.slice(1)) as Heading["level"],
      text: cleanText($(element).text()),
    }))
    .filter((heading: Heading) => heading.text.length > 0);

  const faqContent = extractFaqContent($);
  const internalLinks = extractInternalLinks($, url, origin);
  const externalLinks = extractExternalLinks($, url, origin);
  const images = extractImageSignals($);
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
  const paragraphs = $("p")
    .toArray()
    .map((element) => cleanText($(element).text()))
    .filter((text) => text.split(" ").length >= 8)
    .slice(0, 80);
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
    schemaTypes,
    schemaDetection: { ...schemaDetection, schemaTypes, schemaCount: schemaTypes.length, schemaDetected: schemaTypes.length > 0 || schemaMarkup.length > 0 },
    tables,
    lists,
    paragraphs,
    images,
    openGraph,
    twitterCard,
    authorSignals: collectSignals(signalText, /\b(author|written by|reviewed by|editor|expert|byline|profile)\b/gi),
    contactSignals: collectSignals(signalText, /\b(contact|email|phone|support|address|customer service)\b/gi),
    aboutSignals: collectSignals(signalText, /\b(about us|about|mission|team|company|organization|who we are)\b/gi),
    trustSignals: collectSignals(signalText, /\b(review|testimonial|guarantee|secure|certified|licensed|award|privacy policy|terms|refund|shipping|verified)\b/gi),
    socialProofSignals: collectSignals(signalText, /\b(testimonial|reviews?|rated|stars?|clients?|customers?|case study|portfolio)\b/gi),
    freshnessSignals: collectSignals(signalText, /\b(20\d{2}|updated|last updated|published|reviewed|new|latest|current)\b/gi),
    externalLinks,
    textContent: bodyText,
    wordCount: countWords(bodyText),
  };
}

async function fetchRobots(url: string): Promise<ParsedRobots> {
  try {
    const response = await fetchWithTimeout(url, { timeoutMs: REQUEST_TIMEOUT_MS });
    if (!response.ok) {
      return { found: false, allow: [], disallow: [], groups: [] };
    }

    const text = await response.text();
    return { found: true, ...parseRobotsTxt(text) };
  } catch {
    return { found: false, allow: [], disallow: [], groups: [] };
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

function parseRobotsTxt(text: string): RobotsRules & { groups: ParsedRobots["groups"] } {
  const rules: RobotsRules = { allow: [], disallow: [] };
  const groups: ParsedRobots["groups"] = [];
  let currentGroup: ParsedRobots["groups"][number] | null = null;
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
      if (!currentGroup || currentGroup.allow.length > 0 || currentGroup.disallow.length > 0) {
        currentGroup = { agents: [], allow: [], disallow: [] };
        groups.push(currentGroup);
      }
      currentGroup.agents.push(agent);
      continue;
    }

    if (currentGroup && key === "allow" && value) {
      currentGroup.allow.push(value);
    }
    if (currentGroup && key === "disallow" && value) {
      currentGroup.disallow.push(value);
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

  return { ...rules, groups };
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
        "Accept-Encoding": "gzip, deflate, br",
        "Sec-CH-UA": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        "Sec-CH-UA-Mobile": "?0",
        "Sec-CH-UA-Platform": '"Windows"',
        "Upgrade-Insecure-Requests": "1",
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

function extractExternalLinks($: CheerioRoot, pageUrl: string, origin: string): string[] {
  const links = new Set<string>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href") ?? "";
    try {
      const url = new URL(href, pageUrl);
      if (url.origin !== origin && ["http:", "https:"].includes(url.protocol)) {
        url.hash = "";
        links.add(url.toString());
      }
    } catch {
      // Ignore malformed links.
    }
  });

  return Array.from(links).slice(0, 40);
}

function extractImageSignals($: CheerioRoot): ExtractedPage["images"] {
  let total = 0;
  let missingAlt = 0;

  $("img").each((_, element) => {
    total += 1;
    if (!cleanText($(element).attr("alt") ?? "")) {
      missingAlt += 1;
    }
  });

  return { total, missingAlt };
}

function extractMetaMap($: CheerioRoot, selector: string, keyAttribute: "name" | "property"): Record<string, string> {
  const values: Record<string, string> = {};

  $(selector).each((_, element) => {
    const key = cleanText($(element).attr(keyAttribute) ?? "");
    const content = cleanText($(element).attr("content") ?? "");
    if (key && content) {
      values[key] = content;
    }
  });

  return values;
}

function detectSchemaMarkup($: CheerioRoot, html: string, pageUrl: string): SchemaDetectionResult {
  const warnings: string[] = [];
  const incompleteFields: string[] = [];
  const jsonLdItems = schemaDetectionJsonLd($, html, warnings);
  const semanticMarkup = extractSemanticSchemaMarkup($);
  const schemaTypes = Array.from(new Set([...extractSchemaTypes(jsonLdItems, semanticMarkup), ...extractHydrationSchemaTypes(html)])).sort();
  const microdataItems = $('[itemscope], [itemtype], [itemprop]').toArray().length;
  const rdfaItems = $('[typeof], [property], [vocab], [prefix]').toArray().filter((element) => {
    const value = `${$(element).attr("typeof") ?? ""} ${$(element).attr("property") ?? ""} ${$(element).attr("vocab") ?? ""} ${$(element).attr("prefix") ?? ""}`;
    return /schema\.org|schema:|^[A-Z][A-Za-z]+$/i.test(value);
  }).length;
  const validJsonLdBlocks = jsonLdItems.length;
  const jsonLdBlocks = countJsonLdBlocks($, html);
  const normalizedTypes = schemaTypes.map(normalizeSchemaType);
  const hasType = (type: string) => normalizedTypes.includes(normalizeSchemaType(type));
  const title = cleanText($("title").first().text());
  const metaDescription = cleanText($('meta[name="description"]').attr("content") ?? "");
  const bodyText = cleanText($("body").text());

  if (hasType("FAQPage") && !/"mainEntity"\s*:|itemprop=["']mainEntity/i.test(html)) {
    incompleteFields.push("FAQPage schema is present but mainEntity questions were not clearly detected.");
  }
  if (hasType("Organization") && !/"name"\s*:|itemprop=["']name/i.test(html)) {
    incompleteFields.push("Organization schema is present but a name field was not clearly detected.");
  }
  if (hasType("Product") && !/"name"\s*:|itemprop=["']name/i.test(html)) {
    incompleteFields.push("Product schema is present but a name field was not clearly detected.");
  }
  if ((hasType("Review") || hasType("AggregateRating")) && !/"ratingValue"\s*:|itemprop=["']ratingValue/i.test(html)) {
    incompleteFields.push("Rating or review schema is present but ratingValue was not clearly detected.");
  }

  const recommended = recommendSchemaTypes(schemaTypes, `${title} ${metaDescription} ${bodyText}`, pageUrl);
  const missingRecommendedSchema = recommended.filter((type) => !hasType(type));
  const recommendations = buildSchemaRecommendations(schemaTypes, missingRecommendedSchema, warnings, incompleteFields);

  debugSchemaLog("Schema detection", {
    url: pageUrl,
    jsonLdBlocks,
    validJsonLdBlocks,
    microdataItems,
    rdfaItems,
    schemaTypes,
    warnings,
  });

  return {
    schemaDetected: schemaTypes.length > 0 || semanticMarkup.length > 0,
    schemaTypes,
    schemaCount: schemaTypes.length,
    faqSchema: hasType("FAQPage"),
    organizationSchema: hasType("Organization"),
    productSchema: hasType("Product"),
    localBusinessSchema: hasType("LocalBusiness"),
    breadcrumbSchema: hasType("BreadcrumbList"),
    articleSchema: hasType("Article") || hasType("NewsArticle") || hasType("BlogPosting"),
    websiteSchema: hasType("WebSite"),
    serviceSchema: hasType("Service"),
    personSchema: hasType("Person"),
    reviewSchema: hasType("Review"),
    aggregateRatingSchema: hasType("AggregateRating"),
    jsonLdBlocks,
    jsonLdValidBlocks: validJsonLdBlocks,
    jsonLdInvalidBlocks: Math.max(0, jsonLdBlocks - validJsonLdBlocks),
    microdataItems,
    rdfaItems,
    invalidSchemaWarnings: warnings.slice(0, 12),
    incompleteFields: incompleteFields.slice(0, 12),
    missingRecommendedSchema,
    recommendations,
  };
}

function schemaDetectionJsonLd($: CheerioRoot, html: string, warnings: string[] = []): unknown[] {
  const parsed: unknown[] = [];
  const seen = new Set<string>();

  $("script").each((index, element) => {
    const raw = $(element).html() ?? "";
    const type = ($(element).attr("type") ?? "").toLowerCase();
    const isJsonLd = type.includes("ld+json") || type.includes("json+ld");
    const isSchemaJson = type === "application/json" && /@context|schema\.org|@type/.test(raw);
    if (!raw || (!isJsonLd && !isSchemaJson)) {
      return;
    }
    addParsedJsonLd(raw, `script #${index + 1}`, parsed, seen, warnings);
  });

  for (const match of html.matchAll(/<script\b[^>]*type=["'][^"']*ld\+json[^"']*["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    addParsedJsonLd(match[1] ?? "", "raw script fallback", parsed, seen, warnings);
  }

  for (const match of html.matchAll(/(?:__NEXT_DATA__|self\.__next_f|helmet|ld\+json)[\s\S]{0,6000}?(?:@context|https?:\\?\/\\?\/schema\.org|@type)[\s\S]{0,6000}/gi)) {
    const inferredTypes = extractSchemaTypesFromText(match[0]);
    if (inferredTypes.length > 0) {
      parsed.push({ "@type": inferredTypes, "@context": "https://schema.org" });
    }
  }

  return parsed;
}

function addParsedJsonLd(raw: string, label: string, parsed: unknown[], seen: Set<string>, warnings: string[]): void {
  const cleaned = sanitizeJsonLd(raw);
  if (!cleaned || seen.has(cleaned)) {
    return;
  }
  seen.add(cleaned);

  const value = parseJsonLd(cleaned);
  if (value !== null) {
    parsed.push(value);
    return;
  }

  const repaired = repairJsonLd(cleaned);
  const repairedValue = repaired ? parseJsonLd(repaired) : null;
  if (repairedValue !== null) {
    parsed.push(repairedValue);
    warnings.push(`${label}: JSON-LD parsed after sanitization.`);
    return;
  }

  const fallbackTypes = extractSchemaTypesFromText(cleaned);
  if (fallbackTypes.length > 0) {
    parsed.push({ "@context": "https://schema.org", "@type": fallbackTypes });
    warnings.push(`${label}: invalid JSON-LD, but schema types were recovered.`);
    debugSchemaLog("Invalid JSON-LD recovered", { label, fallbackTypes });
    return;
  }

  warnings.push(`${label}: invalid JSON-LD could not be parsed.`);
  debugSchemaLog("Invalid JSON-LD", { label, preview: cleaned.slice(0, 180) });
}

function extractSemanticSchemaMarkup($: CheerioRoot): string[] {
  const values = new Set<string>();

  $('[itemscope], [itemtype], [itemprop], [typeof], [property^="schema:"], [vocab*="schema.org"], [prefix*="schema"]').each((_, element) => {
    const itemType = $(element).attr("itemtype") ?? "";
    const typeOf = $(element).attr("typeof") ?? "";
    const property = $(element).attr("property") ?? "";
    const vocab = $(element).attr("vocab") ?? "";
    const prefix = $(element).attr("prefix") ?? "";
    const text = cleanText(`${itemType} ${typeOf} ${property} ${vocab} ${prefix}`);
    if (text) {
      values.add(text);
    }
  });

  return Array.from(values).slice(0, 80);
}

function extractSchemaTypes(jsonLd: unknown[], microdata: string[]): string[] {
  const found = new Set<string>();

  for (const item of jsonLd) {
    collectJsonLdTypes(item, found);
  }

  for (const value of microdata) {
    extractSchemaTypesFromText(value).forEach((type) => found.add(type));
  }

  return Array.from(found).slice(0, 30);
}

function collectJsonLdTypes(value: unknown, found: Set<string>): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectJsonLdTypes(item, found));
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  const type = value["@type"];
  if (typeof type === "string") {
    found.add(type);
  }
  if (Array.isArray(type)) {
    type.filter((item): item is string => typeof item === "string").forEach((item) => found.add(item));
  }

  Object.values(value).forEach((item) => collectJsonLdTypes(item, found));
}

function countJsonLdBlocks($: CheerioRoot, html: string): number {
  const cheerioCount = $("script").toArray().filter((element) => {
    const type = ($(element).attr("type") ?? "").toLowerCase();
    return type.includes("ld+json") || type.includes("json+ld");
  }).length;
  const rawCount = Array.from(html.matchAll(/<script\b[^>]*type=["'][^"']*ld\+json[^"']*["'][^>]*>/gi)).length;
  return Math.max(cheerioCount, rawCount);
}

function extractHydrationSchemaTypes(html: string): string[] {
  const matches = html.match(/(?:@type|\\u0040type|schema\.org|schema\\u002eorg|FAQPage|LocalBusiness|Product|Article|BreadcrumbList|Organization|WebSite|Service|Person|Review|AggregateRating)[\s\S]{0,280}/gi) ?? [];
  return Array.from(new Set(matches.flatMap(extractSchemaTypesFromText))).slice(0, 30);
}

function extractSchemaTypesFromText(value: string): string[] {
  const decoded = decodeHtmlEntities(value).replace(/\\\//g, "/").replace(/\\u002f/gi, "/").replace(/\\u0040/gi, "@");
  const found = new Set<string>();
  const patterns = [
    /schema\.org\/([A-Za-z][A-Za-z0-9_-]+)/gi,
    /["']@type["']\s*:\s*["']([^"']+)["']/gi,
    /\\?"@type\\?"\s*:\s*\\?"([^"\\]+)\\?"/gi,
    /\b(?:typeof|itemtype)=["'][^"']*?([A-Z][A-Za-z0-9_-]+)["']/gi,
    /\bschema:([A-Za-z][A-Za-z0-9_-]+)/gi,
  ];

  for (const pattern of patterns) {
    for (const match of decoded.matchAll(pattern)) {
      const raw = match[1] ?? "";
      raw.split(/\s*,\s*|\s+/).map(normalizeSchemaType).filter(Boolean).forEach((type) => found.add(type));
    }
  }

  COMMON_SCHEMA_TYPES.forEach((type) => {
    if (new RegExp(`\\b${escapeRegExp(type)}\\b`, "i").test(decoded)) {
      found.add(type);
    }
  });

  return Array.from(found).filter((type) => /^[A-Z][A-Za-z0-9_-]+$/.test(type)).slice(0, 30);
}

function recommendSchemaTypes(existingTypes: string[], text: string, pageUrl: string): string[] {
  const recommended = new Set<string>(["Organization", "WebSite", "BreadcrumbList"]);
  const source = `${text} ${pageUrl}`.toLowerCase();

  if (/\b(faq|frequently asked|what|how|why|can|does|should)\b/.test(source)) recommended.add("FAQPage");
  if (/\b(product|sku|price|sale|cart|shop|collection|brand)\b/.test(source)) recommended.add("Product");
  if (/\b(article|blog|news|guide|published|author|post)\b/.test(source)) recommended.add("Article");
  if (/\b(local|near me|address|phone|directions|opening hours|service area|restaurant|clinic|florist|store)\b/.test(source)) recommended.add("LocalBusiness");
  if (/\b(service|services|quote|booking|appointment|consultation|repair|delivery)\b/.test(source)) recommended.add("Service");
  if (/\b(review|rating|testimonial|stars)\b/.test(source)) {
    recommended.add("Review");
    recommended.add("AggregateRating");
  }
  if (/\b(author|founder|expert|profile|person)\b/.test(source)) recommended.add("Person");

  const existing = new Set(existingTypes.map(normalizeSchemaType));
  return Array.from(recommended).filter((type) => !existing.has(normalizeSchemaType(type))).slice(0, 8);
}

function buildSchemaRecommendations(schemaTypes: string[], missing: string[], warnings: string[], incomplete: string[]): string[] {
  const recommendations: string[] = [];
  if (schemaTypes.length === 0) {
    recommendations.push("Add JSON-LD structured data for Organization, WebSite, BreadcrumbList, and the primary page type.");
  }
  if (missing.length > 0) {
    recommendations.push(`Consider adding ${missing.slice(0, 5).join(", ")} schema where it accurately matches the page content.`);
  }
  if (warnings.length > 0) {
    recommendations.push("Validate malformed JSON-LD in Google's Rich Results Test or Schema Markup Validator.");
  }
  if (incomplete.length > 0) {
    recommendations.push("Complete required and recommended schema fields such as name, url, mainEntity, offers, ratingValue, and author.");
  }
  return recommendations.slice(0, 6);
}

function analyzeAiCrawlerAccess(startUrl: URL, robots: ParsedRobots): AiCrawlerAccess[] {
  const crawlers: AiCrawlerAccess["crawler"][] = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot", "Bytespider"];

  return crawlers.map((crawler) => {
    const agent = crawler.toLowerCase();
    const groups = robots.groups.filter((group) => group.agents.includes(agent) || group.agents.includes("*"));
    const matchedRules = groups.flatMap((group) => group.disallow.map((rule) => `Disallow: ${rule}`).concat(group.allow.map((rule) => `Allow: ${rule}`)));
    const disallow = groups.flatMap((group) => group.disallow);
    const allow = groups.flatMap((group) => group.allow);
    const homeAllowed = isAllowedByRobots(startUrl, { allow, disallow });
    const hasBroadBlock = disallow.some((rule) => rule === "/");
    const hasPartialRules = disallow.some((rule) => rule && rule !== "/");

    return {
      crawler,
      status: hasBroadBlock && !homeAllowed ? "blocked" : hasPartialRules ? "partially restricted" : "allowed",
      matchedRules: matchedRules.slice(0, 8),
    };
  });
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

function sanitizeJsonLd(raw: string): string {
  return decodeHtmlEntities(raw)
    .replace(/^\uFEFF/, "")
    .replace(/<!--|-->/g, "")
    .replace(/<\/script\s*>/gi, "")
    .trim();
}

function repairJsonLd(raw: string): string {
  const trimmed = raw.trim();
  const firstObject = trimmed.indexOf("{");
  const firstArray = trimmed.indexOf("[");
  const startCandidates = [firstObject, firstArray].filter((index) => index >= 0);
  const start = startCandidates.length ? Math.min(...startCandidates) : -1;
  const end = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));

  if (start < 0 || end <= start) {
    return "";
  }

  return trimmed
    .slice(start, end + 1)
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/[\u0000-\u001F]+/g, " ")
    .trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#x22;/gi, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#47;/g, "/");
}

function normalizeSchemaType(type: string): string {
  return type
    .replace(/^https?:\/\/schema\.org\//i, "")
    .replace(/^schema:/i, "")
    .replace(/[^A-Za-z0-9_-]/g, "")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function debugSchemaLog(message: string, details: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.info(`[GEO schema] ${message}`, details);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
