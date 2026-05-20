import type { GeoCrawlResult } from "./crawler";
import { calculateGeoScore, type GeoScoreBreakdown } from "./score-engine";
import { generateRuleBasedSuggestions, type Suggestion } from "./suggestions";

export type GeoAnalysisResult = {
  geoScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: Suggestion[];
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
  };
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
  const { geoScore, breakdown } = calculateGeoScore(crawl);
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
    suggestions: generateRuleBasedSuggestions(crawl, breakdown),
    technicalFindings: {
      ...crawl.technicalFindings,
      scoreBreakdown: breakdown,
      analyzedUrls: crawl.pages.map((page) => page.url),
    },
  };
}
