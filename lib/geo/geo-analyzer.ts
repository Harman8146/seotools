import type { GeoCrawlResult } from "./crawler";
import { calculateGeoScore, type GeoCategoryScores, type GeoScoreBreakdown, type PageGeoReport } from "./score-engine";
import { buildAuditIssues, generateRuleBasedSuggestions, type AuditIssue, type Suggestion } from "./suggestions";

export type GeoAnalysisResult = {
  geoScore: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  criticalIssues: AuditIssue[];
  aiOptimizationOpportunities: AuditIssue[];
  technicalImprovements: AuditIssue[];
  contentImprovements: AuditIssue[];
  suggestions: Suggestion[];
  scores: GeoCategoryScores;
  advancedAnalytics: AdvancedGeoAnalytics;
  pageAnalysis: PageGeoReport[];
  technicalFindings: {
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
    scoreBreakdown: GeoScoreBreakdown;
    analyzedUrls: string[];
    duplicateTitles: string[];
    duplicateDescriptions: string[];
    schemaTypesDetected: string[];
    aiCrawlerAccess: GeoCrawlResult["technicalFindings"]["robotsTxt"]["aiCrawlerAccess"];
  };
};

export type AdvancedGeoAnalytics = {
  aiAnswerPreviews: Array<{ url: string; preview: string }>;
  citationProbability: {
    score: number;
    label: "High" | "Medium" | "Low";
    factors: string[];
  };
  topicalGapSummary: {
    missingTopics: string[];
    missingEntities: string[];
    missingRelationships: string[];
  };
  entityCoverageSummary: {
    detectedEntities: string[];
    weakEntities: string[];
    missingEntities: string[];
  };
  faqOpportunities: string[];
  intentSummary: Array<{ intent: string; pages: number }>;
  internalLinkDepth: {
    orphanPages: string[];
    weaklyLinkedPages: string[];
    depthWarnings: string[];
  };
  llmsTxtRecommendation: string;
  aiCrawlerSummary: Array<{ crawler: string; status: string; recommendation: string }>;
  exportReadySummary: string;
};

const LABELS: Record<keyof GeoScoreBreakdown, string> = {
  readability: "Readable, natural-language content",
  semanticStructure: "Clear semantic heading structure",
  aiFriendliness: "AI-friendly answer formatting",
  entityClarity: "Clear entities and brand context",
  faqOptimization: "FAQ coverage",
  schemaUsage: "Structured data usage",
  eeat: "Experience, expertise, authoritativeness, and trust signals",
  topicalAuthority: "Topical authority across internal pages",
  chunkedContent: "Chunked, retrievable content",
  aiCrawlerAccessibility: "AI crawler accessibility",
  llmsTxtPresence: "llms.txt availability",
};

export function analyzeGeo(crawl: GeoCrawlResult): GeoAnalysisResult {
  const { geoScore, breakdown, categoryScores, pageReports } = calculateGeoScore(crawl);
  const auditIssues = buildAuditIssues(crawl, breakdown);
  const strengths = Object.entries(breakdown)
    .filter(([, score]) => score >= 75)
    .map(([key]) => LABELS[key as keyof GeoScoreBreakdown]);
  const weaknesses = Object.entries(breakdown)
    .filter(([, score]) => score < 60)
    .map(([key]) => LABELS[key as keyof GeoScoreBreakdown]);

  return {
    geoScore,
    strengths,
    weaknesses,
    opportunities: buildOpportunities(crawl, breakdown),
    criticalIssues: auditIssues.filter((issue) => issue.priority === "critical"),
    aiOptimizationOpportunities: auditIssues.filter((issue) => ["aiAccessibility", "schema", "content"].includes(issue.category)).slice(0, 8),
    technicalImprovements: auditIssues.filter((issue) => issue.category === "technical" || issue.category === "schema").slice(0, 8),
    contentImprovements: auditIssues.filter((issue) => issue.category === "content" || issue.category === "eeat").slice(0, 8),
    suggestions: generateRuleBasedSuggestions(crawl, breakdown),
    scores: categoryScores,
    advancedAnalytics: buildAdvancedAnalytics(crawl, categoryScores, pageReports),
    pageAnalysis: pageReports,
    technicalFindings: {
      ...crawl.technicalFindings,
      scoreBreakdown: breakdown,
      analyzedUrls: crawl.pages.map((page) => page.url),
      duplicateTitles: findDuplicates(crawl.pages.map((page) => page.title).filter(Boolean)),
      duplicateDescriptions: findDuplicates(crawl.pages.map((page) => page.metaDescription).filter(Boolean)),
      schemaTypesDetected: Array.from(new Set(crawl.pages.flatMap((page) => page.schemaTypes))).sort(),
      aiCrawlerAccess: crawl.technicalFindings.robotsTxt.aiCrawlerAccess,
    },
  };
}

function buildAdvancedAnalytics(crawl: GeoCrawlResult, scores: GeoCategoryScores, pageReports: PageGeoReport[]): AdvancedGeoAnalytics {
  const allMissingTopics = pageReports.flatMap((page) => page.topicalGaps.missingTopics);
  const allMissingEntities = pageReports.flatMap((page) => page.topicalGaps.missingEntities);
  const allMissingRelationships = pageReports.flatMap((page) => page.topicalGaps.missingRelationships);
  const allDetectedEntities = pageReports.flatMap((page) => page.entityCoverage.detectedEntities);
  const allWeakEntities = pageReports.flatMap((page) => page.entityCoverage.weakEntities);
  const faqOpportunities = pageReports.flatMap((page) => page.faqOpportunities.map((question) => `${question} (${shortUrl(page.url)})`));
  const intentCounts = new Map<string, number>();

  pageReports.forEach((page) => {
    page.searchIntent.detectedIntents.forEach((intent) => intentCounts.set(intent, (intentCounts.get(intent) ?? 0) + 1));
  });

  return {
    aiAnswerPreviews: pageReports.slice(0, 5).map((page) => ({ url: page.url, preview: page.aiAnswerPreview })),
    citationProbability: {
      score: scores.citationProbabilityScore,
      label: scores.citationProbabilityScore >= 75 ? "High" : scores.citationProbabilityScore >= 55 ? "Medium" : "Low",
      factors: buildCitationFactors(pageReports),
    },
    topicalGapSummary: {
      missingTopics: topCounts(allMissingTopics, 8),
      missingEntities: topCounts(allMissingEntities, 8),
      missingRelationships: topCounts(allMissingRelationships, 8),
    },
    entityCoverageSummary: {
      detectedEntities: topCounts(allDetectedEntities, 14),
      weakEntities: topCounts(allWeakEntities, 10),
      missingEntities: topCounts(allMissingEntities, 10),
    },
    faqOpportunities: Array.from(new Set(faqOpportunities)).slice(0, 12),
    intentSummary: Array.from(intentCounts.entries()).map(([intent, pages]) => ({ intent, pages })).sort((a, b) => b.pages - a.pages),
    internalLinkDepth: analyzeInternalLinkDepth(crawl),
    llmsTxtRecommendation: generateLlmsTxt(crawl, pageReports),
    aiCrawlerSummary: crawl.technicalFindings.robotsTxt.aiCrawlerAccess.map((crawler) => ({
      crawler: crawler.crawler,
      status: crawler.status,
      recommendation:
        crawler.status === "allowed"
          ? "Accessible for public AI discovery."
          : crawler.status === "blocked"
            ? "Review robots.txt if you want this AI crawler to access public content."
            : "Partially restricted; verify important public URLs are still accessible.",
    })),
    exportReadySummary: buildExportSummary(crawl, scores, pageReports),
  };
}

function buildCitationFactors(pageReports: PageGeoReport[]): string[] {
  const factors: string[] = [];
  if (pageReports.some((page) => page.aiTrustScore >= 75)) factors.push("Strong trust and transparency signals exist on at least one crawled page.");
  if (pageReports.some((page) => page.aiExtractionQuality >= 75)) factors.push("Content contains extractable answer blocks, lists, FAQs, or tables.");
  if (pageReports.some((page) => page.entityCoverage.detectedEntities.length >= 6)) factors.push("Important entities are visible in titles, headings, and body copy.");
  if (pageReports.some((page) => page.featuredSnippetScore < 60)) factors.push("Some pages need concise answers, tables, lists, or FAQ blocks to improve citation readiness.");
  if (pageReports.some((page) => page.topicalGaps.missingTopics.length > 0)) factors.push("Topical gaps may reduce authority for broad AI answer coverage.");
  return factors.slice(0, 6);
}

function analyzeInternalLinkDepth(crawl: GeoCrawlResult): AdvancedGeoAnalytics["internalLinkDepth"] {
  const crawledUrls = new Set(crawl.pages.map((page) => page.url));
  const inbound = new Map<string, number>();
  crawl.pages.forEach((page) => inbound.set(page.url, 0));

  crawl.pages.forEach((page) => {
    page.internalLinks.forEach((link) => {
      if (crawledUrls.has(link)) {
        inbound.set(link, (inbound.get(link) ?? 0) + 1);
      }
    });
  });

  const startUrl = crawl.pages[0]?.url;
  const orphanPages = Array.from(inbound.entries())
    .filter(([url, count]) => count === 0 && url !== startUrl)
    .map(([url]) => url);
  const weaklyLinkedPages = Array.from(inbound.entries())
    .filter(([url, count]) => count <= 1 && url !== startUrl)
    .map(([url]) => url)
    .slice(0, 8);
  const depthWarnings = crawl.pages
    .filter((page) => page.internalLinks.filter((link) => crawledUrls.has(link)).length === 0 && crawl.pages.length > 1)
    .map((page) => `${shortUrl(page.url)} has no detected links to other crawled pages.`)
    .slice(0, 8);

  return { orphanPages, weaklyLinkedPages, depthWarnings };
}

function generateLlmsTxt(crawl: GeoCrawlResult, pageReports: PageGeoReport[]): string {
  const bestPages = [...pageReports].sort((a, b) => b.aiVisibilityScore - a.aiVisibilityScore).slice(0, 8);
  return [
    `# ${new URL(crawl.origin).hostname}`,
    "",
    "## Purpose",
    "This file highlights public pages that are useful for AI assistants, answer engines, and research crawlers.",
    "",
    "## Recommended Pages",
    ...bestPages.map((page) => `- ${page.url} - ${page.aiAnswerPreview}`),
    "",
    "## Guidance",
    "- Prefer canonical public pages.",
    "- Summarize content accurately and cite the source URL when possible.",
    "- Respect robots.txt and page-level robots directives.",
  ].join("\n");
}

function buildExportSummary(crawl: GeoCrawlResult, scores: GeoCategoryScores, pageReports: PageGeoReport[]): string {
  const weakestPage = [...pageReports].sort((a, b) => a.geoScore - b.geoScore)[0];
  return [
    `Analyzed ${crawl.pages.length} crawlable page(s).`,
    `GEO Score: ${scores.geoScore}/100. AI Visibility: ${scores.aiVisibilityScore}/100. Citation Probability: ${scores.citationProbabilityScore}/100.`,
    weakestPage ? `Weakest page: ${weakestPage.url} (${weakestPage.geoScore}/100).` : "",
    `Primary opportunity: ${pageReports.flatMap((page) => page.topicalGaps.missingTopics)[0] ?? "Improve answer-friendly content structure"}.`,
  ].filter(Boolean).join(" ");
}

function topCounts(values: string[], limit: number): string[] {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([value]) => value)
    .slice(0, limit);
}

function shortUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return url;
  }
}

function buildOpportunities(crawl: GeoCrawlResult, breakdown: GeoScoreBreakdown): string[] {
  const opportunities: string[] = [];

  if (breakdown.faqOptimization < 75) opportunities.push("Add more question-answer sections for answer-engine extraction.");
  if (breakdown.schemaUsage < 75) opportunities.push("Expand JSON-LD coverage for Organization, Breadcrumb, Product, FAQ, Article, or LocalBusiness entities.");
  if (breakdown.chunkedContent < 75) opportunities.push("Create more scannable content chunks using lists, tables, definitions, and summaries.");
  if (!crawl.technicalFindings.llmsTxt.found) opportunities.push("Publish llms.txt to guide AI systems to canonical resources.");
  if (crawl.pages.some((page) => page.images.missingAlt > 0)) opportunities.push("Improve image alt text to increase accessibility and semantic context.");
  if (crawl.pages.some((page) => page.socialProofSignals.length === 0)) opportunities.push("Add reviews, testimonials, case studies, or proof points where relevant.");

  return opportunities.slice(0, 8);
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    const normalized = value.trim().toLowerCase();
    if (seen.has(normalized)) {
      duplicates.add(value);
    }
    seen.add(normalized);
  }

  return Array.from(duplicates);
}
