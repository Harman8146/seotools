import type { GeoCrawlResult } from "./crawler";
import type { GeoScoreBreakdown } from "./score-engine";

export type Suggestion = {
  priority: "high" | "medium" | "low";
  category: keyof GeoScoreBreakdown | "technical";
  title: string;
  recommendation: string;
};

export function generateRuleBasedSuggestions(
  crawl: GeoCrawlResult,
  breakdown: GeoScoreBreakdown
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  addIfLow(suggestions, breakdown.readability, "readability", "Improve answer readability", "Rewrite dense paragraphs into direct, short answers with clear definitions, examples, and natural language summaries.");
  addIfLow(suggestions, breakdown.semanticStructure, "semanticStructure", "Strengthen heading hierarchy", "Use one descriptive H1, supporting H2 sections, and H3 subsections so generative engines can map the page structure quickly.");
  addIfLow(suggestions, breakdown.aiFriendliness, "aiFriendliness", "Make content easier to quote and synthesize", "Add concise summaries, comparison lists, key takeaways, and direct answers near the top of important pages.");
  addIfLow(suggestions, breakdown.entityClarity, "entityClarity", "Clarify named entities", "Make the brand, product, service area, people, locations, and core topic explicit in titles, headings, metadata, and schema.");
  addIfLow(suggestions, breakdown.faqOptimization, "faqOptimization", "Add question-led content", "Include useful FAQ blocks with complete answers that match real customer questions and mark them up with FAQPage JSON-LD where appropriate.");
  addIfLow(suggestions, breakdown.schemaUsage, "schemaUsage", "Expand structured data", "Add valid JSON-LD for Organization, WebSite, BreadcrumbList, Article, Product, Service, or FAQPage depending on the page type.");
  addIfLow(suggestions, breakdown.eeat, "eeat", "Show trust and expertise signals", "Add author bios, editorial review notes, contact details, about information, policies, and organization/person schema.");
  addIfLow(suggestions, breakdown.topicalAuthority, "topicalAuthority", "Build topical coverage", "Create or expose more internally linked supporting pages that answer related subtopics in depth.");
  addIfLow(suggestions, breakdown.chunkedContent, "chunkedContent", "Chunk content for retrieval", "Break long pages into labelled sections, lists, tables, definitions, steps, pros and cons, and compact answer blocks.");
  addIfLow(suggestions, breakdown.aiCrawlerAccessibility, "aiCrawlerAccessibility", "Improve crawler accessibility", "Review robots directives, noindex tags, failed pages, redirects, and server responses so AI crawlers can access public content.");

  if (!crawl.technicalFindings.llmsTxt.found) {
    suggestions.push({
      priority: "low",
      category: "llmsTxtPresence",
      title: "Publish an llms.txt file",
      recommendation: "Add /llms.txt with concise links to your most useful public documentation, policies, product pages, and support resources.",
    });
  }

  if (crawl.pages.some((page) => !page.canonicalUrl)) {
    suggestions.push({
      priority: "medium",
      category: "technical",
      title: "Add canonical URLs",
      recommendation: "Include canonical link tags on indexable pages to reduce ambiguity when AI systems consolidate sources.",
    });
  }

  if (crawl.technicalFindings.failedPages.length > 0) {
    suggestions.push({
      priority: "high",
      category: "technical",
      title: "Fix failed internal pages",
      recommendation: "Resolve non-HTML responses, request failures, and server errors found during the internal crawl.",
    });
  }

  return suggestions.slice(0, 12);
}

function addIfLow(
  suggestions: Suggestion[],
  score: number,
  category: keyof GeoScoreBreakdown,
  title: string,
  recommendation: string
): void {
  if (score >= 75) {
    return;
  }

  suggestions.push({
    priority: score < 50 ? "high" : "medium",
    category,
    title,
    recommendation,
  });
}
