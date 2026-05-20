import type { GeoCrawlResult, ExtractedPage } from "./crawler";

export type GeoScoreBreakdown = {
  readability: number;
  semanticStructure: number;
  aiFriendliness: number;
  entityClarity: number;
  faqOptimization: number;
  schemaUsage: number;
  eeat: number;
  topicalAuthority: number;
  chunkedContent: number;
  aiCrawlerAccessibility: number;
  llmsTxtPresence: number;
};

export type GeoScoreResult = {
  geoScore: number;
  breakdown: GeoScoreBreakdown;
};

const WEIGHTS: Record<keyof GeoScoreBreakdown, number> = {
  readability: 10,
  semanticStructure: 10,
  aiFriendliness: 12,
  entityClarity: 10,
  faqOptimization: 8,
  schemaUsage: 10,
  eeat: 10,
  topicalAuthority: 10,
  chunkedContent: 8,
  aiCrawlerAccessibility: 8,
  llmsTxtPresence: 4,
};

export function calculateGeoScore(crawl: GeoCrawlResult): GeoScoreResult {
  const pages = crawl.pages;
  const breakdown: GeoScoreBreakdown = {
    readability: average(pages.map(scoreReadability)),
    semanticStructure: average(pages.map(scoreSemanticStructure)),
    aiFriendliness: average(pages.map(scoreAiFriendliness)),
    entityClarity: average(pages.map(scoreEntityClarity)),
    faqOptimization: average(pages.map(scoreFaqOptimization)),
    schemaUsage: average(pages.map(scoreSchemaUsage)),
    eeat: average(pages.map(scoreEeat)),
    topicalAuthority: scoreTopicalAuthority(crawl),
    chunkedContent: average(pages.map(scoreChunkedContent)),
    aiCrawlerAccessibility: scoreAiCrawlerAccessibility(crawl),
    llmsTxtPresence: crawl.technicalFindings.llmsTxt.found ? 100 : 0,
  };

  const geoScore = Math.round(
    Object.entries(breakdown).reduce((total, [key, value]) => {
      return total + (value * WEIGHTS[key as keyof GeoScoreBreakdown]) / 100;
    }, 0)
  );

  return { geoScore: clamp(geoScore), breakdown };
}

function scoreReadability(page: ExtractedPage): number {
  const sentences = page.textContent.split(/[.!?]+/).filter((item) => item.trim().length > 0).length || 1;
  const words = Math.max(page.wordCount, 1);
  const averageSentenceLength = words / sentences;

  if (words < 120) {
    return 35;
  }
  if (averageSentenceLength >= 12 && averageSentenceLength <= 24) {
    return 95;
  }
  if (averageSentenceLength > 32) {
    return 45;
  }
  return 72;
}

function scoreSemanticStructure(page: ExtractedPage): number {
  let score = 0;
  const h1Count = page.headings.filter((heading) => heading.level === 1).length;
  const h2Count = page.headings.filter((heading) => heading.level === 2).length;
  const hasLogicalDepth = page.headings.some((heading) => heading.level >= 3);

  if (page.title) score += 15;
  if (page.metaDescription) score += 15;
  if (h1Count === 1) score += 25;
  if (h2Count >= 2) score += 25;
  if (hasLogicalDepth) score += 10;
  if (page.canonicalUrl) score += 10;

  return clamp(score);
}

function scoreAiFriendliness(page: ExtractedPage): number {
  let score = 20;
  if (page.wordCount >= 450) score += 20;
  if (page.lists.length > 0) score += 15;
  if (page.tables.length > 0) score += 10;
  if (page.faqContent.length > 0) score += 20;
  if (page.jsonLd.length > 0) score += 15;

  return clamp(score);
}

function scoreEntityClarity(page: ExtractedPage): number {
  const source = `${page.title} ${page.metaDescription} ${page.headings.map((heading) => heading.text).join(" ")}`;
  const capitalizedTerms = new Set(source.match(/\b[A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){0,3}\b/g) ?? []);
  const hasBrandLikeTitle = page.title.length >= 8 && page.title.length <= 80;

  return clamp((hasBrandLikeTitle ? 35 : 15) + Math.min(capitalizedTerms.size * 8, 55) + (page.aboutSignals.length ? 10 : 0));
}

function scoreFaqOptimization(page: ExtractedPage): number {
  if (page.faqContent.length >= 5) return 100;
  if (page.faqContent.length >= 3) return 80;
  if (page.faqContent.length >= 1) return 55;
  return hasFaqSchema(page) ? 70 : 20;
}

function scoreSchemaUsage(page: ExtractedPage): number {
  let score = 0;
  if (page.jsonLd.length > 0) score += 55;
  if (page.schemaMarkup.length > 0) score += 20;
  if (hasFaqSchema(page)) score += 15;
  if (hasOrganizationSchema(page)) score += 10;
  return clamp(score);
}

function scoreEeat(page: ExtractedPage): number {
  let score = 20;
  if (page.authorSignals.length > 0) score += 20;
  if (page.contactSignals.length > 0) score += 20;
  if (page.aboutSignals.length > 0) score += 20;
  if (hasOrganizationSchema(page) || hasPersonSchema(page)) score += 20;
  return clamp(score);
}

function scoreTopicalAuthority(crawl: GeoCrawlResult): number {
  const pages = crawl.pages;
  const totalWords = pages.reduce((sum, page) => sum + page.wordCount, 0);
  let score = Math.min(pages.length * 8, 40);
  if (totalWords >= 2500) score += 30;
  if (totalWords >= 5000) score += 15;
  if (new Set(pages.flatMap((page) => page.headings.map((heading) => heading.text.toLowerCase()))).size >= 12) {
    score += 15;
  }
  return clamp(score);
}

function scoreChunkedContent(page: ExtractedPage): number {
  let score = 15;
  if (page.headings.length >= 4) score += 30;
  if (page.lists.length >= 2) score += 25;
  if (page.tables.length >= 1) score += 15;
  if (page.textContent.split(/\n|\.\s/).filter((part) => part.trim().split(/\s+/).length <= 80).length >= 6) score += 15;
  return clamp(score);
}

function scoreAiCrawlerAccessibility(crawl: GeoCrawlResult): number {
  let score = 100;
  if (!crawl.technicalFindings.robotsTxt.found) score -= 10;
  if (crawl.technicalFindings.skippedByRobots.length > 0) score -= 20;
  if (crawl.technicalFindings.failedPages.length > 0) score -= Math.min(crawl.technicalFindings.failedPages.length * 8, 30);
  if (crawl.pages.some((page) => /noindex|nofollow/i.test(page.robotsMeta))) score -= 25;
  return clamp(score);
}

function hasFaqSchema(page: ExtractedPage): boolean {
  return JSON.stringify(page.jsonLd).toLowerCase().includes("faqpage");
}

function hasOrganizationSchema(page: ExtractedPage): boolean {
  return JSON.stringify(page.jsonLd).toLowerCase().includes("organization");
}

function hasPersonSchema(page: ExtractedPage): boolean {
  return JSON.stringify(page.jsonLd).toLowerCase().includes("person");
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
