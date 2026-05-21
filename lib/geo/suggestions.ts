import type { ExtractedPage, GeoCrawlResult } from "./crawler";
import type { GeoScoreBreakdown } from "./score-engine";

export type IssuePriority = "critical" | "high" | "medium" | "low";
export type ImpactLevel = "High" | "Medium" | "Low";
export type DifficultyLevel = "Easy" | "Medium" | "Hard";

export type Suggestion = {
  priority: IssuePriority;
  category: keyof GeoScoreBreakdown | "technical" | "content" | "schema" | "aiAccessibility" | "eeat";
  title: string;
  recommendation: string;
  issue?: string;
  explanation?: string;
  whyItMatters?: string;
  seoImpact?: ImpactLevel;
  geoImpact?: ImpactLevel;
  priorityScore?: number;
  difficulty?: DifficultyLevel;
};

export type AuditIssue = Required<Pick<Suggestion, "issue" | "explanation" | "recommendation">> & {
  priority: IssuePriority;
  category: Suggestion["category"];
  whyItMatters: string;
  seoImpact: ImpactLevel;
  geoImpact: ImpactLevel;
  priorityScore: number;
  difficulty: DifficultyLevel;
  affectedUrls: string[];
};

export function generateRuleBasedSuggestions(
  crawl: GeoCrawlResult,
  breakdown: GeoScoreBreakdown
): Suggestion[] {
  return buildAuditIssues(crawl, breakdown)
    .slice(0, 14)
    .map((issue) => ({
      priority: issue.priority,
      category: issue.category,
      title: issue.issue,
      issue: issue.issue,
      explanation: issue.explanation,
      whyItMatters: issue.whyItMatters,
      seoImpact: issue.seoImpact,
      geoImpact: issue.geoImpact,
      priorityScore: issue.priorityScore,
      difficulty: issue.difficulty,
      recommendation: issue.recommendation,
    }));
}

export function buildAuditIssues(crawl: GeoCrawlResult, breakdown: GeoScoreBreakdown): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const pages = crawl.pages;

  addIfLow(issues, pages, breakdown.readability, "content", "Improve answer readability", "Dense or awkward content is harder for users and answer engines to parse.", "AI systems extract cleaner answers from concise paragraphs, clear definitions, and simple sentence structures.", "Medium", "High", "Medium", "Rewrite dense paragraphs into direct answers with definitions, examples, and concise summaries.");
  addIfLow(issues, pages, breakdown.semanticStructure, "technical", "Strengthen heading hierarchy", "Weak heading structure reduces page scannability and makes topical sections harder to classify.", "Generative engines use headings as retrieval anchors when summarizing pages and selecting evidence.", "High", "High", "Easy", "Use one descriptive H1, supporting H2 sections, and H3 subsections for specific entities, questions, and attributes.");
  addIfLow(issues, pages, breakdown.aiFriendliness, "content", "Improve AI answer extraction quality", "Important answers are not consistently formatted for extraction.", "AI answer engines favor clear answer blocks, lists, tables, definitions, and concise summaries.", "Medium", "High", "Medium", "Add summary blocks, key takeaways, comparison sections, and direct answers near the top of important pages.");
  addIfLow(issues, pages, breakdown.entityClarity, "content", "Clarify named entities", "Brand, product, service, location, or people entities are not clear enough across key page elements.", "Clear entities help AI systems connect your site to topics, brands, locations, and user intents.", "Medium", "High", "Easy", "Make the brand, services, locations, experts, and product names explicit in titles, headings, copy, and schema.");
  addIfLow(issues, pages, breakdown.faqOptimization, "schema", "Missing or weak FAQ optimization", "Question-answer content is limited or not exposed in a structured way.", "AI systems frequently use concise Q&A content for conversational answers and follow-up questions.", "Medium", "High", "Easy", "Add FAQ sections with complete answers and use FAQPage JSON-LD where appropriate.");
  addIfLow(issues, pages, breakdown.schemaUsage, "schema", "Expand structured data coverage", "Structured data is missing or incomplete across crawled pages.", "Schema gives search and AI systems explicit context about organizations, products, breadcrumbs, articles, and FAQs.", "High", "High", "Medium", "Add valid JSON-LD for Organization, WebSite, BreadcrumbList, Article, Product, Service, LocalBusiness, or FAQPage depending on page type.");
  addIfLow(issues, pages, breakdown.eeat, "eeat", "Increase E-E-A-T trust signals", "The crawl found limited author, contact, about, business, or transparency signals.", "Trust and transparency signals help AI systems choose reliable sources for recommendations.", "Medium", "High", "Medium", "Add author/reviewer details, contact information, about pages, policies, business information, and organization/person schema.");
  addIfLow(issues, pages, breakdown.chunkedContent, "content", "Chunk content for retrieval", "Some content is not split into clear sections that are easy to quote or summarize.", "Retrieval systems perform better when content is broken into labelled, compact, self-contained chunks.", "Medium", "High", "Easy", "Break pages into lists, tables, steps, definitions, pros and cons, and section summaries.");

  const missingCanonical = pages.filter((page) => !page.canonicalUrl);
  if (missingCanonical.length > 0) {
    issues.push(createIssue("medium", "technical", "Missing canonical URLs", "Some pages do not expose canonical link tags.", "Canonical tags reduce source ambiguity when AI systems consolidate duplicate or similar pages.", "Medium", "Medium", "Easy", "Add canonical link tags on all indexable pages.", missingCanonical));
  }

  const missingOg = pages.filter((page) => Object.keys(page.openGraph).length === 0);
  if (missingOg.length > 0) {
    issues.push(createIssue("low", "technical", "Missing Open Graph metadata", "Some pages do not include Open Graph metadata.", "Rich metadata helps crawlers and downstream systems understand page titles, descriptions, and representative media.", "Low", "Medium", "Easy", "Add og:title, og:description, og:type, and og:image to important pages.", missingOg));
  }

  const missingAlt = pages.filter((page) => page.images.missingAlt > 0);
  if (missingAlt.length > 0) {
    issues.push(createIssue("medium", "technical", "Images missing alt text", "Some crawled pages include images without descriptive alt text.", "Alt text improves accessibility and gives AI systems more context about visual content.", "Medium", "Medium", "Easy", "Add concise descriptive alt text to meaningful images and leave decorative images empty intentionally.", missingAlt));
  }

  const thinPages = pages.filter((page) => page.wordCount < 250);
  if (thinPages.length > 0) {
    issues.push(createIssue("high", "content", "Thin content detected", "Some pages have very low word counts and may not provide enough context.", "Thin pages are less likely to be selected as authoritative sources in AI answers.", "High", "High", "Medium", "Expand thin pages with clear answers, service details, FAQs, examples, and internal links to related content.", thinPages));
  }

  const blockedCrawlers = crawl.technicalFindings.robotsTxt.aiCrawlerAccess.filter((crawler) => crawler.status === "blocked");
  if (blockedCrawlers.length > 0) {
    issues.push({
      priority: "critical",
      category: "aiAccessibility",
      issue: "AI crawlers blocked in robots.txt",
      explanation: `${blockedCrawlers.map((crawler) => crawler.crawler).join(", ")} appear blocked.`,
      whyItMatters: "Blocked AI crawlers may prevent your public content from being discovered, summarized, or cited by major answer systems.",
      seoImpact: "Low",
      geoImpact: "High",
      priorityScore: 96,
      difficulty: "Easy",
      recommendation: "Review robots.txt directives and allow desired AI crawlers to access public, indexable content.",
      affectedUrls: [crawl.technicalFindings.robotsTxt.url],
    });
  }

  if (!crawl.technicalFindings.llmsTxt.found) {
    issues.push({
      priority: "low",
      category: "aiAccessibility",
      issue: "Missing llms.txt",
      explanation: "The crawl could not confirm an /llms.txt file.",
      whyItMatters: "llms.txt can guide AI systems toward canonical public resources, documentation, policies, and high-value pages.",
      seoImpact: "Low",
      geoImpact: "Medium",
      priorityScore: 38,
      difficulty: "Easy",
      recommendation: "Publish /llms.txt with concise links to your most useful public pages and resources.",
      affectedUrls: [crawl.technicalFindings.llmsTxt.url],
    });
  }

  return issues.sort((a, b) => b.priorityScore - a.priorityScore);
}

function addIfLow(
  issues: AuditIssue[],
  pages: ExtractedPage[],
  score: number,
  category: AuditIssue["category"],
  title: string,
  explanation: string,
  whyItMatters: string,
  seoImpact: ImpactLevel,
  geoImpact: ImpactLevel,
  difficulty: DifficultyLevel,
  recommendation: string
): void {
  if (score >= 75) {
    return;
  }

  issues.push({
    priority: score < 40 ? "critical" : score < 55 ? "high" : "medium",
    category,
    issue: title,
    explanation,
    whyItMatters,
    seoImpact,
    geoImpact,
    priorityScore: Math.max(20, 100 - score),
    difficulty,
    recommendation,
    affectedUrls: pages.slice(0, 5).map((page) => page.url),
  });
}

function createIssue(
  priority: IssuePriority,
  category: AuditIssue["category"],
  issue: string,
  explanation: string,
  whyItMatters: string,
  seoImpact: ImpactLevel,
  geoImpact: ImpactLevel,
  difficulty: DifficultyLevel,
  recommendation: string,
  affectedPages: ExtractedPage[]
): AuditIssue {
  const priorityScore = priority === "critical" ? 95 : priority === "high" ? 78 : priority === "medium" ? 58 : 28;

  return {
    priority,
    category,
    issue,
    explanation,
    whyItMatters,
    seoImpact,
    geoImpact,
    priorityScore,
    difficulty,
    recommendation,
    affectedUrls: affectedPages.slice(0, 6).map((page) => page.url),
  };
}
