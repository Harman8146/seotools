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
  categoryScores: GeoCategoryScores;
  pageReports: PageGeoReport[];
};

export type GeoCategoryScores = {
  geoScore: number;
  aiVisibilityScore: number;
  technicalSeoScore: number;
  contentQualityScore: number;
  eeatScore: number;
  aiAccessibilityScore: number;
  citationProbabilityScore: number;
};

export type PageGeoReport = {
  url: string;
  geoScore: number;
  aiVisibilityScore: number;
  contentQualityScore: number;
  technicalSeoScore: number;
  citationProbabilityScore: number;
  aiTrustScore: number;
  aiExtractionQuality: number;
  contentCompletenessScore: number;
  topicCoverageScore: number;
  featuredSnippetScore: number;
  issueCount: number;
  schemaCount: number;
  wordCount: number;
  headingStructureQuality: number;
  aiAnswerPreview: string;
  searchIntent: SearchIntentAnalysis;
  chunkOptimization: ChunkOptimizationAnalysis;
  entityCoverage: EntityCoverageAnalysis;
  topicalGaps: TopicalGapAnalysis;
  faqOpportunities: string[];
  readabilityHeatmap: ReadabilityHeatmapItem[];
  featuredSnippetOpportunities: string[];
  strengths: string[];
  weaknesses: string[];
  contentQualityScores: ContentQualityScores;
  contentIssues: ContentBlockIssue[];
};

export type SearchIntentAnalysis = {
  primaryIntent: "Informational" | "Transactional" | "Local" | "Navigational";
  detectedIntents: string[];
  mismatchWarning?: string;
};

export type ChunkOptimizationAnalysis = {
  score: number;
  oversizedParagraphs: number;
  missingSubheadingSignals: number;
  scanability: "Strong" | "Moderate" | "Weak";
  recommendations: string[];
};

export type EntityCoverageAnalysis = {
  detectedEntities: string[];
  weakEntities: string[];
  missingEntities: string[];
  semanticRelationships: string[];
};

export type TopicalGapAnalysis = {
  missingTopics: string[];
  missingEntities: string[];
  missingRelationships: string[];
};

export type ReadabilityHeatmapItem = {
  type: "Heading" | "Paragraph" | "FAQ" | "List" | "Table";
  label: string;
  text: string;
  score: number;
  tone: "weak" | "average" | "strong";
  reason: string;
};

export type ContentQualityScores = {
  headingQuality: number;
  readability: number;
  semanticDepth: number;
  aiFriendliness: number;
  geoFormatting: number;
  contentCompleteness: number;
};

export type ContentBlockIssue = {
  type: "Heading" | "Paragraph" | "FAQ" | "Table" | "List" | "Missing Section" | "Semantic Gap" | "AI Formatting";
  affectedSection: string;
  currentText: string;
  issue: string;
  explanation: string;
  recommendation: string;
  priority: "Critical" | "High" | "Medium" | "Low";
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

  const categoryScores: GeoCategoryScores = {
    geoScore: clamp(geoScore),
    aiVisibilityScore: clamp(average([breakdown.aiFriendliness, breakdown.entityClarity, breakdown.chunkedContent, breakdown.faqOptimization, breakdown.topicalAuthority])),
    technicalSeoScore: scoreTechnicalSeo(crawl),
    contentQualityScore: clamp(average([breakdown.readability, breakdown.semanticStructure, breakdown.chunkedContent, scoreContentDepth(crawl)])),
    eeatScore: breakdown.eeat,
    aiAccessibilityScore: breakdown.aiCrawlerAccessibility,
    citationProbabilityScore: clamp(average(pages.map(scoreCitationProbability))),
  };

  return { geoScore: categoryScores.geoScore, breakdown, categoryScores, pageReports: pages.map(scorePageReport) };
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
  if (page.schemaDetection.schemaDetected) score += 15;

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
  if (page.schemaDetection.jsonLdValidBlocks > 0) score += 50;
  if (page.schemaDetection.microdataItems > 0 || page.schemaDetection.rdfaItems > 0 || page.schemaMarkup.length > 0) score += 25;
  if (hasFaqSchema(page)) score += 15;
  if (hasOrganizationSchema(page)) score += 10;
  if (page.schemaDetection.invalidSchemaWarnings.length > 0) score -= 10;
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
  const blockedCrawlers = crawl.technicalFindings.robotsTxt.aiCrawlerAccess.filter((crawler) => crawler.status === "blocked").length;
  const restrictedCrawlers = crawl.technicalFindings.robotsTxt.aiCrawlerAccess.filter((crawler) => crawler.status === "partially restricted").length;
  score -= blockedCrawlers * 10;
  score -= restrictedCrawlers * 4;
  return clamp(score);
}

function scoreTechnicalSeo(crawl: GeoCrawlResult): number {
  const pages = crawl.pages;
  let score = 100;

  score -= pages.filter((page) => !page.canonicalUrl).length * 5;
  score -= pages.filter((page) => !page.metaDescription).length * 5;
  score -= pages.filter((page) => Object.keys(page.openGraph).length === 0).length * 3;
  score -= pages.filter((page) => Object.keys(page.twitterCard).length === 0).length * 2;
  score -= pages.filter((page) => page.images.total > 0 && page.images.missingAlt / page.images.total > 0.35).length * 4;
  score -= crawl.technicalFindings.failedPages.length * 6;
  score -= crawl.technicalFindings.robotsTxt.found ? 0 : 8;
  score -= crawl.technicalFindings.llmsTxt.found ? 0 : 6;

  return clamp(score);
}

function scoreContentDepth(crawl: GeoCrawlResult): number {
  const totalWords = crawl.pages.reduce((sum, page) => sum + page.wordCount, 0);
  const averageWords = crawl.pages.length ? totalWords / crawl.pages.length : 0;

  if (averageWords >= 800) return 95;
  if (averageWords >= 500) return 82;
  if (averageWords >= 250) return 64;
  return 38;
}

function scorePageReport(page: ExtractedPage): PageGeoReport {
  const headingStructureQuality = scoreSemanticStructure(page);
  const aiVisibilityScore = clamp(average([scoreAiFriendliness(page), scoreEntityClarity(page), scoreFaqOptimization(page), scoreChunkedContent(page)]));
  const contentQualityScore = clamp(average([scoreReadability(page), headingStructureQuality, scoreParagraphQuality(page)]));
  const technicalSeoScore = scorePageTechnicalSeo(page);
  const aiTrustScore = scoreAiTrust(page);
  const aiExtractionQuality = scoreAiExtractionQuality(page);
  const citationProbabilityScore = scoreCitationProbability(page);
  const contentCompletenessScore = scoreContentCompleteness(page);
  const topicCoverageScore = scoreTopicCoverage(page);
  const featuredSnippetScore = scoreFeaturedSnippetReadiness(page);
  const geoScore = clamp(average([aiVisibilityScore, contentQualityScore, technicalSeoScore, scoreEeat(page)]));
  const contentIssues = analyzeContentBlocks(page);
  const contentQualityScores = scoreContentQualityDimensions(page, contentIssues);
  const topicalGaps = analyzeTopicalGaps(page);

  return {
    url: page.url,
    geoScore,
    aiVisibilityScore,
    contentQualityScore,
    technicalSeoScore,
    citationProbabilityScore,
    aiTrustScore,
    aiExtractionQuality,
    contentCompletenessScore,
    topicCoverageScore,
    featuredSnippetScore,
    issueCount: countPageIssues(page),
    schemaCount: page.schemaDetection.schemaCount,
    wordCount: page.wordCount,
    headingStructureQuality,
    aiAnswerPreview: generateAiAnswerPreview(page),
    searchIntent: analyzeSearchIntent(page),
    chunkOptimization: analyzeChunkOptimization(page),
    entityCoverage: analyzeEntityCoverage(page, topicalGaps.missingEntities),
    topicalGaps,
    faqOpportunities: generateFaqOpportunities(page),
    readabilityHeatmap: buildReadabilityHeatmap(page),
    featuredSnippetOpportunities: generateFeaturedSnippetOpportunities(page),
    strengths: getPageStrengths(page, contentQualityScores),
    weaknesses: getPageWeaknesses(page, contentIssues, contentQualityScores),
    contentQualityScores,
    contentIssues,
  };
}

function scoreCitationProbability(page: ExtractedPage): number {
  return clamp(
    average([
      scoreAiExtractionQuality(page),
      scoreAiTrust(page),
      scoreEntityClarity(page),
      scoreFaqOptimization(page),
      scoreFeaturedSnippetReadiness(page),
      scoreContentCompleteness(page),
    ])
  );
}

function scoreAiTrust(page: ExtractedPage): number {
  let score = 20;
  if (page.url.startsWith("https://")) score += 12;
  if (page.aboutSignals.length > 0) score += 14;
  if (page.contactSignals.length > 0) score += 14;
  if (page.authorSignals.length > 0) score += 14;
  if (page.trustSignals.length > 0) score += 12;
  if (page.socialProofSignals.length > 0) score += 8;
  if (hasOrganizationSchema(page) || hasPersonSchema(page)) score += 6;
  return clamp(score);
}

function scoreAiExtractionQuality(page: ExtractedPage): number {
  let score = 25;
  if (page.paragraphs.some((paragraph) => paragraph.split(/\s+/).length >= 35 && paragraph.split(/\s+/).length <= 90)) score += 18;
  if (page.headings.length >= 4) score += 16;
  if (page.lists.length >= 1) score += 12;
  if (page.tables.length >= 1) score += 10;
  if (page.faqContent.length >= 2) score += 12;
  if (/\b(is|means|refers to|defined as)\b/i.test(page.textContent)) score += 7;
  return clamp(score);
}

function scoreTopicCoverage(page: ExtractedPage): number {
  const gaps = analyzeTopicalGaps(page);
  return clamp(scoreContentCompleteness(page) + Math.min(page.headings.length * 2, 12) - (gaps.missingTopics.length + gaps.missingRelationships.length) * 6);
}

function scoreFeaturedSnippetReadiness(page: ExtractedPage): number {
  let score = 20;
  if (page.faqContent.length > 0) score += 20;
  if (page.lists.length > 0) score += 18;
  if (page.tables.length > 0) score += 16;
  if (page.paragraphs.some((paragraph) => paragraph.split(/\s+/).length >= 35 && paragraph.split(/\s+/).length <= 65)) score += 16;
  if (page.headings.some((heading) => /\b(what|how|why|cost|price|best|compare|vs)\b/i.test(heading.text))) score += 10;
  return clamp(score);
}

function generateAiAnswerPreview(page: ExtractedPage): string {
  const topic = pickTopicPhrase(page);
  const details = [
    page.faqContent.length > 0 ? "common questions" : "",
    page.lists.length > 0 ? "key benefits or steps" : "",
    page.tables.length > 0 ? "comparison details" : "",
    page.contactSignals.length > 0 ? "business contact context" : "",
    page.schemaTypes.length > 0 ? "structured data signals" : "",
  ].filter(Boolean);
  const detailText = details.length > 0 ? ` It includes ${details.slice(0, 3).join(", ")}.` : "";
  return `This page explains ${topic}.${detailText} AI systems may summarize it as a resource for users researching ${topic}.`;
}

function analyzeSearchIntent(page: ExtractedPage): SearchIntentAnalysis {
  const source = `${page.title} ${page.metaDescription} ${page.textContent}`.toLowerCase();
  const detected: string[] = [];
  if (/\b(what|how|why|guide|tips|learn|definition|examples?)\b/.test(source)) detected.push("Informational");
  if (/\b(buy|quote|pricing|price|cost|order|book|hire|service|services|rent|download)\b/.test(source)) detected.push("Transactional");
  if (/\b(near me|local|location|city|area|address|directions|ontario|toronto|hamilton|service area)\b/.test(source)) detected.push("Local");
  if (/\b(login|sign in|brand|company|about|contact|support)\b/.test(source)) detected.push("Navigational");

  const primaryIntent = (detected[0] as SearchIntentAnalysis["primaryIntent"]) ?? "Informational";
  const mismatchWarning =
    detected.includes("Transactional") && page.faqContent.length === 0 && !/\b(price|cost|quote|contact)\b/i.test(source)
      ? "Transactional terms appear, but pricing, quote, or decision-support content is weak."
      : detected.includes("Local") && page.contactSignals.length === 0
        ? "Local intent appears, but address, phone, or service-area signals are limited."
        : undefined;

  return { primaryIntent, detectedIntents: detected.length ? detected : ["Informational"], mismatchWarning };
}

function analyzeChunkOptimization(page: ExtractedPage): ChunkOptimizationAnalysis {
  const oversizedParagraphs = page.paragraphs.filter((paragraph) => paragraph.split(/\s+/).length > 120).length;
  const missingSubheadingSignals = page.headings.filter((heading) => heading.level <= 2).length < 2 ? 1 : 0;
  const score = clamp(scoreChunkedContent(page) - oversizedParagraphs * 8 - missingSubheadingSignals * 15);
  const recommendations: string[] = [];
  if (oversizedParagraphs > 0) recommendations.push("Split oversized paragraphs into 40-90 word answer blocks.");
  if (missingSubheadingSignals > 0) recommendations.push("Add descriptive H2 sections for services, definitions, pricing, examples, and FAQs.");
  if (page.lists.length < 2) recommendations.push("Use bullets or numbered lists for steps, benefits, options, and requirements.");
  if (page.tables.length === 0) recommendations.push("Add a compact comparison table where attributes, costs, or options matter.");

  return {
    score,
    oversizedParagraphs,
    missingSubheadingSignals,
    scanability: score >= 80 ? "Strong" : score >= 60 ? "Moderate" : "Weak",
    recommendations: recommendations.slice(0, 5),
  };
}

function analyzeEntityCoverage(page: ExtractedPage, missingEntities: string[]): EntityCoverageAnalysis {
  const detectedEntities = extractEntities(`${page.title} ${page.metaDescription} ${page.headings.map((heading) => heading.text).join(" ")} ${page.textContent}`);
  const weakEntities = detectedEntities.filter((entity) => countOccurrences(page.textContent.toLowerCase(), entity.toLowerCase()) < 2).slice(0, 8);
  const relationships = buildSemanticRelationships(page, detectedEntities);

  return {
    detectedEntities: detectedEntities.slice(0, 14),
    weakEntities,
    missingEntities,
    semanticRelationships: relationships,
  };
}

function analyzeTopicalGaps(page: ExtractedPage): TopicalGapAnalysis {
  const source = `${page.title} ${page.metaDescription} ${page.headings.map((heading) => heading.text).join(" ")} ${page.textContent}`.toLowerCase();
  const topic = pickTopicPhrase(page);
  const missingTopics = [
    { label: "FAQs", pattern: /\b(faq|frequently asked|what|how much|how long|can i)\b/i, missing: page.faqContent.length < 2 },
    { label: "Pricing or cost details", pattern: /\b(price|pricing|cost|rates|quote|estimate)\b/i },
    { label: "Comparisons", pattern: /\b(compare|comparison|versus|vs\.?|pros and cons|best option)\b/i },
    { label: "Definitions", pattern: /\b(is a|means|definition|defined as|refers to)\b/i },
    { label: "Examples or use cases", pattern: /\b(example|use case|scenario|case study|for businesses|for homeowners)\b/i },
    { label: "Local/service-area context", pattern: /\b(near me|local|service area|city|region|address|directions)\b/i },
  ]
    .filter((item) => item.missing ?? !item.pattern.test(source))
    .map((item) => item.label);

  const missingEntities = [
    !/\b(company|brand|team|business)\b/i.test(source) ? "Brand or organization entity" : "",
    !/\b(service|product|solution|tool|platform)\b/i.test(source) ? "Primary product or service entity" : "",
    !/\b(city|state|province|country|near|local|area)\b/i.test(source) ? "Location entity" : "",
    !/\b(expert|author|team|reviewed|certified|licensed)\b/i.test(source) ? "Expert or author entity" : "",
  ].filter(Boolean);

  return {
    missingTopics: missingTopics.slice(0, 8),
    missingEntities,
    missingRelationships: [
      `How ${topic} solves the user's problem`,
      `Who ${topic} is best for`,
      `When to choose ${topic} over alternatives`,
    ].filter((relationship) => !source.includes(relationship.toLowerCase().slice(0, 16))).slice(0, 3),
  };
}

function generateFaqOpportunities(page: ExtractedPage): string[] {
  const context = detectBusinessContext(page);
  const intent = analyzeSearchIntent(page);
  const localSuffix = context.location ? ` in ${context.location}` : "";
  const product = context.productOrService;
  const questions: string[] = [];

  if (context.businessType === "florist") {
    questions.push(
      `Do you offer same-day flower delivery${localSuffix}?`,
      "Can customers schedule flower delivery for a future date?",
      "Which arrangements are most popular for birthdays, anniversaries, or sympathy gifts?",
      "What should customers know before ordering flowers online?",
      "Can customers add a note, vase, or gift item to an order?",
      "How long does local flower delivery usually take?"
    );
  } else if (context.businessType === "retail") {
    questions.push(
      `Do you offer local pickup or delivery${localSuffix}?`,
      `Which ${product} options are most popular with customers?`,
      "What should customers check before ordering online?",
      "Can customers return or exchange an online order?",
      "How do customers choose the right size, style, or option?",
      "Are there new arrivals, sale items, or seasonal collections available?"
    );
  } else if (context.businessType === "local-service") {
    questions.push(
      `Do you serve customers${localSuffix}?`,
      `How soon can someone book or request ${product}?`,
      `What details should customers share before requesting ${product}?`,
      `How is pricing usually estimated for ${product}?`,
      "What makes your service different from nearby alternatives?",
      "Can customers get support for urgent or same-day requests?"
    );
  } else if (intent.detectedIntents.includes("Transactional")) {
    questions.push(
      `How can customers compare ${product} before choosing?`,
      `What should buyers know before ordering ${product} online?`,
      `Are prices, packages, or options available for ${product}?`,
      "Can customers request help before making a decision?",
      "What are the most common questions customers ask before buying?"
    );
  } else {
    questions.push(
      `What should visitors know before choosing ${product}?`,
      `Which ${product} details matter most when comparing options?`,
      "What common mistakes should visitors avoid?",
      "Where can visitors find pricing, examples, or service details?",
      "What proof, reviews, or trust signals should visitors look for?"
    );
  }

  const existing = page.faqContent.join(" ").toLowerCase();
  return Array.from(new Set(questions))
    .filter((question) => !existing.includes(question.toLowerCase().replace("?", "")))
    .slice(0, 6);
}

function detectBusinessContext(page: ExtractedPage): { businessType: "florist" | "retail" | "local-service" | "general"; productOrService: string; location: string } {
  const source = `${page.title} ${page.metaDescription} ${page.headings.map((heading) => heading.text).join(" ")} ${page.textContent}`.toLowerCase();
  const topic = pickTopicPhrase(page).replace(/\b(home|official|store|shop)\b/gi, "").trim();
  const locationMatch = source.match(/\b(milton|hamilton|toronto|ontario|canada|new york|london|sydney|melbourne|calgary|vancouver)\b/i);
  const location = locationMatch?.[0] ? toTitleCase(locationMatch[0]) : "";

  if (/\b(flower|florist|bouquet|arrangement|roses|sympathy|birthday|anniversary)\b/i.test(source)) {
    return { businessType: "florist", productOrService: "flowers", location };
  }
  if (/\b(shoe|shoes|sneaker|boots|sandals|collection|new arrivals|apparel|clothing)\b/i.test(source)) {
    return { businessType: "retail", productOrService: "products", location };
  }
  if (/\b(service|services|quote|booking|appointment|repair|rental|delivery|installation|consultation)\b/i.test(source)) {
    return { businessType: "local-service", productOrService: topic || "this service", location };
  }
  return { businessType: "general", productOrService: topic || "this page", location };
}

function buildReadabilityHeatmap(page: ExtractedPage): ReadabilityHeatmapItem[] {
  const headingItems = page.headings.slice(0, 8).map((heading, index) => {
    const words = heading.text.split(/\s+/).filter(Boolean).length;
    const generic = /^(services|products|about|welcome|home|overview|learn more|our services)$/i.test(heading.text);
    const score = generic ? 35 : words >= 3 ? 82 : 58;
    return createHeatmapItem("Heading", `H${heading.level} #${index + 1}`, heading.text, score, generic ? "Generic heading weakens semantic extraction." : "Heading clarity signal.");
  });
  const paragraphItems = page.paragraphs.slice(0, 10).map((paragraph, index) => {
    const words = paragraph.split(/\s+/).filter(Boolean).length;
    const score = words < 35 ? 45 : words > 140 ? 50 : 84;
    const reason = words < 35 ? "Thin content block." : words > 140 ? "Large block should be split for retrieval." : "Self-contained answer-sized paragraph.";
    return createHeatmapItem("Paragraph", `Paragraph #${index + 1}`, truncate(paragraph, 180), score, reason);
  });
  return [...headingItems, ...paragraphItems].slice(0, 16);
}

function generateFeaturedSnippetOpportunities(page: ExtractedPage): string[] {
  const ideas: string[] = [];
  if (!page.paragraphs.some((paragraph) => paragraph.split(/\s+/).length >= 35 && paragraph.split(/\s+/).length <= 65)) {
    ideas.push("Add a 40-60 word direct answer below the primary H1 or key H2.");
  }
  if (page.lists.length === 0) ideas.push("Create a numbered steps list or concise benefits list.");
  if (page.tables.length === 0) ideas.push("Add a comparison table for prices, features, locations, sizes, or options.");
  if (page.faqContent.length < 2) ideas.push("Add FAQ answers written as complete, quotable responses.");
  if (!/\b(what is|how to|cost|best|vs|compare)\b/i.test(page.headings.map((heading) => heading.text).join(" "))) {
    ideas.push("Use question-style headings for high-intent answer queries.");
  }
  return ideas.slice(0, 5);
}

function createHeatmapItem(type: ReadabilityHeatmapItem["type"], label: string, text: string, score: number, reason: string): ReadabilityHeatmapItem {
  return {
    type,
    label,
    text,
    score: clamp(score),
    tone: score >= 75 ? "strong" : score >= 55 ? "average" : "weak",
    reason,
  };
}

function scoreContentQualityDimensions(page: ExtractedPage, issues: ContentBlockIssue[]): ContentQualityScores {
  const headingIssues = issues.filter((issue) => issue.type === "Heading").length;
  const semanticIssues = issues.filter((issue) => issue.type === "Semantic Gap" || issue.issue.toLowerCase().includes("semantic")).length;
  const formattingIssues = issues.filter((issue) => issue.type === "AI Formatting" || issue.type === "List" || issue.type === "Table").length;
  const missingIssues = issues.filter((issue) => issue.type === "Missing Section" || issue.type === "FAQ").length;

  return {
    headingQuality: clamp(scoreSemanticStructure(page) - headingIssues * 10),
    readability: scoreReadability(page),
    semanticDepth: clamp(scoreEntityClarity(page) - semanticIssues * 12 + Math.min(page.schemaTypes.length * 3, 9)),
    aiFriendliness: scoreAiFriendliness(page),
    geoFormatting: clamp(scoreChunkedContent(page) - formattingIssues * 10),
    contentCompleteness: clamp(scoreContentCompleteness(page) - missingIssues * 8),
  };
}

function analyzeContentBlocks(page: ExtractedPage): ContentBlockIssue[] {
  const issues: ContentBlockIssue[] = [];
  const titleTerms = extractImportantTerms(`${page.title} ${page.metaDescription}`);

  page.headings.forEach((heading, index) => {
    const words = heading.text.split(/\s+/).filter(Boolean);
    const generic = /^(services|products|about|welcome|home|overview|learn more|our services|shop|collection)$/i.test(heading.text);
    const hasIntent = titleTerms.some((term) => heading.text.toLowerCase().includes(term));

    if (generic || words.length < 3 || (heading.level <= 2 && !hasIntent && titleTerms.length > 0)) {
      issues.push({
        type: "Heading",
        affectedSection: `H${heading.level} #${index + 1}`,
        currentText: heading.text,
        issue: generic ? "Generic heading" : words.length < 3 ? "Thin heading" : "Unclear topic intent",
        explanation: `AI systems use H${heading.level} headings as section labels. This heading does not clearly describe the page topic or user intent.`,
        recommendation: buildHeadingRecommendation(page, heading.text),
        priority: heading.level <= 2 ? "High" : "Medium",
      });
    }
  });

  page.paragraphs.slice(0, 30).forEach((paragraph, index) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    const repeatedWordRatio = getRepeatedWordRatio(paragraph);
    const hasEntity = titleTerms.some((term) => paragraph.toLowerCase().includes(term));

    if (words.length < 35 || words.length > 140 || repeatedWordRatio > 0.18 || (!hasEntity && titleTerms.length > 1)) {
      issues.push({
        type: "Paragraph",
        affectedSection: `Paragraph #${index + 1}`,
        currentText: truncate(paragraph, 220),
        issue: words.length < 35 ? "Thin paragraph" : words.length > 140 ? "Large text block" : repeatedWordRatio > 0.18 ? "Repetitive wording" : "Weak semantic relevance",
        explanation: "This paragraph may be harder for AI systems to extract as a complete, useful answer because it lacks depth, focus, or scanable structure.",
        recommendation: "Rewrite this block as a concise, self-contained answer with the main entity, location or topic, specific details, and one clear takeaway.",
        priority: words.length > 180 ? "High" : "Medium",
      });
    }
  });

  if (page.faqContent.length < 2) {
    issues.push({
      type: "FAQ",
      affectedSection: "FAQ content",
      currentText: page.faqContent[0] ?? "No substantial FAQ content detected",
      issue: "Weak FAQ structure",
      explanation: "Question-answer sections help answer engines match conversational prompts and extract direct responses.",
      recommendation: "Add 3-6 specific FAQs covering pricing, process, location/service area, delivery, comparisons, and common objections.",
      priority: "High",
    });
  }

  if (page.tables.length === 0) {
    issues.push({
      type: "Missing Section",
      affectedSection: "Comparison or data table",
      currentText: "No table detected",
      issue: "Missing comparison/table content",
      explanation: "Tables improve featured-snippet potential and help AI systems compare attributes, pricing, options, or service details.",
      recommendation: "Add a compact table comparing options, service areas, features, prices, timelines, or use cases where relevant.",
      priority: "Medium",
    });
  }

  if (page.lists.length < 2) {
    issues.push({
      type: "AI Formatting",
      affectedSection: "Lists and scannable chunks",
      currentText: page.lists[0] ? truncate(page.lists[0], 180) : "Limited list formatting detected",
      issue: "Poor AI scanability",
      explanation: "AI retrieval systems and users scan lists more easily than long prose blocks.",
      recommendation: "Add bullet lists for benefits, steps, requirements, examples, service details, and key takeaways.",
      priority: "Medium",
    });
  }

  if (page.wordCount < 450) {
    issues.push({
      type: "Missing Section",
      affectedSection: "Topical depth",
      currentText: `${page.wordCount} words detected`,
      issue: "Low informational depth",
      explanation: "The page may not provide enough context to be treated as an authoritative source for AI-generated answers.",
      recommendation: "Add definitions, examples, use cases, step-by-step guidance, comparisons, FAQs, and internal links to related supporting pages.",
      priority: "High",
    });
  }

  if (page.aboutSignals.length === 0 && page.contactSignals.length === 0 && page.trustSignals.length === 0) {
    issues.push({
      type: "Semantic Gap",
      affectedSection: "Trust and E-E-A-T signals",
      currentText: "Limited author, contact, about, or trust signals detected",
      issue: "Weak E-E-A-T context",
      explanation: "AI systems may be less likely to trust or recommend pages without transparent business, author, or proof signals.",
      recommendation: "Add business details, contact context, policies, reviews, expert notes, or links to about/contact pages.",
      priority: "Medium",
    });
  }

  return issues.slice(0, 18);
}

function scoreContentCompleteness(page: ExtractedPage): number {
  let score = 30;
  if (page.wordCount >= 450) score += 20;
  if (page.faqContent.length >= 2) score += 15;
  if (page.lists.length >= 2) score += 12;
  if (page.tables.length > 0) score += 10;
  if (page.aboutSignals.length || page.contactSignals.length || page.trustSignals.length) score += 8;
  if (page.freshnessSignals.length > 0) score += 5;
  return clamp(score);
}

function getPageStrengths(page: ExtractedPage, scores: ContentQualityScores): string[] {
  const strengths: string[] = [];
  if (scores.headingQuality >= 80) strengths.push("Clear heading structure");
  if (scores.readability >= 80) strengths.push("Readable answer-friendly copy");
  if (scores.semanticDepth >= 80) strengths.push("Strong entity and topic clarity");
  if (page.lists.length >= 2) strengths.push("Good list-based scanability");
  if (page.wordCount >= 800) strengths.push("Strong informational depth");
  if (page.schemaTypes.length > 0) strengths.push("Structured data detected");
  return strengths.length ? strengths : ["Crawlable page with analyzable content"];
}

function getPageWeaknesses(page: ExtractedPage, issues: ContentBlockIssue[], scores: ContentQualityScores): string[] {
  const weaknesses = new Set<string>();
  if (scores.headingQuality < 70) weaknesses.add("Heading clarity needs improvement");
  if (scores.semanticDepth < 70) weaknesses.add("Semantic/entity coverage is weak");
  if (scores.geoFormatting < 70) weaknesses.add("Content is not chunked enough for AI extraction");
  if (page.faqContent.length < 2) weaknesses.add("FAQ coverage is limited");
  if (page.tables.length === 0) weaknesses.add("No comparison or table content detected");
  issues.slice(0, 3).forEach((issue) => weaknesses.add(issue.issue));
  return Array.from(weaknesses).slice(0, 6);
}

function buildHeadingRecommendation(page: ExtractedPage, current: string): string {
  const primary = extractImportantTerms(`${page.title} ${page.metaDescription}`).slice(0, 4).join(" ");
  if (!primary) {
    return `Replace "${current}" with a descriptive heading that names the topic, service, location, or user intent.`;
  }
  return `Replace "${current}" with a descriptive heading such as "${toTitleCase(primary)} Guide, Benefits, Pricing, or FAQs".`;
}

function extractImportantTerms(text: string): string[] {
  const stop = new Set(["the", "and", "for", "with", "from", "your", "you", "our", "are", "best", "page", "home", "near", "that", "this", "have", "more"]);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stop.has(word));
  return Array.from(new Set(words)).slice(0, 12);
}

function extractEntities(text: string): string[] {
  const capitalized = text.match(/\b[A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){0,3}\b/g) ?? [];
  const topical = extractImportantTerms(text)
    .filter((term) => term.length > 4)
    .map(toTitleCase);
  return Array.from(new Set([...capitalized, ...topical]))
    .filter((entity) => !/^(Home|Services|Products|About|Contact|Welcome)$/i.test(entity))
    .slice(0, 20);
}

function buildSemanticRelationships(page: ExtractedPage, entities: string[]): string[] {
  const topic = pickTopicPhrase(page);
  const relationships = new Set<string>();
  const source = page.textContent.toLowerCase();

  if (entities.length > 0) relationships.add(`${entities[0]} is connected to ${topic}`);
  if (/\b(price|pricing|cost|rates)\b/.test(source)) relationships.add(`${topic} includes pricing or cost considerations`);
  if (/\b(location|near|local|city|area|delivery|service area)\b/.test(source)) relationships.add(`${topic} has local or service-area relevance`);
  if (/\b(review|testimonial|case study|client|customer)\b/.test(source)) relationships.add(`${topic} includes proof or customer evidence`);
  if (/\b(compare|versus|alternative|option|choose)\b/.test(source)) relationships.add(`${topic} is compared against alternatives or options`);

  return Array.from(relationships).slice(0, 6);
}

function pickTopicPhrase(page: ExtractedPage): string {
  const h1 = page.headings.find((heading) => heading.level === 1)?.text;
  const seed = h1 || page.title || page.metaDescription || new URL(page.url).hostname;
  const cleaned = seed
    .replace(/\s+[|–-]\s+.*$/, "")
    .replace(/\b(home|welcome|official site)\b/gi, "")
    .trim();
  return cleaned || "the page topic";
}

function countOccurrences(text: string, term: string): number {
  if (!term) return 0;
  return text.split(term).length - 1;
}

function getRepeatedWordRatio(text: string): number {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4);
  if (words.length === 0) return 0;
  return 1 - new Set(words).size / words.length;
}

function truncate(text: string, length: number): string {
  return text.length > length ? `${text.slice(0, length).trim()}...` : text;
}

function toTitleCase(text: string): string {
  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function scoreParagraphQuality(page: ExtractedPage): number {
  if (page.paragraphs.length === 0) return 35;
  const longParagraphs = page.paragraphs.filter((paragraph) => paragraph.split(/\s+/).length > 120).length;
  const ratio = longParagraphs / page.paragraphs.length;
  if (ratio <= 0.1) return 92;
  if (ratio <= 0.25) return 76;
  return 52;
}

function scorePageTechnicalSeo(page: ExtractedPage): number {
  let score = 100;
  if (!page.canonicalUrl) score -= 12;
  if (!page.metaDescription) score -= 12;
  if (Object.keys(page.openGraph).length === 0) score -= 8;
  if (Object.keys(page.twitterCard).length === 0) score -= 5;
  if (/noindex/i.test(page.robotsMeta)) score -= 25;
  if (page.images.total > 0) score -= Math.round((page.images.missingAlt / page.images.total) * 12);
  return clamp(score);
}

function countPageIssues(page: ExtractedPage): number {
  let count = 0;
  if (!page.title) count += 1;
  if (!page.metaDescription) count += 1;
  if (!page.canonicalUrl) count += 1;
  if (page.headings.filter((heading) => heading.level === 1).length !== 1) count += 1;
  if (page.wordCount < 250) count += 1;
  if (page.schemaTypes.length === 0) count += 1;
  if (page.images.missingAlt > 0) count += 1;
  if (page.faqContent.length === 0) count += 1;
  return count;
}

function hasFaqSchema(page: ExtractedPage): boolean {
  return page.schemaDetection.faqSchema || hasSchemaType(page, "FAQPage");
}

function hasOrganizationSchema(page: ExtractedPage): boolean {
  return page.schemaDetection.organizationSchema || hasSchemaType(page, "Organization");
}

function hasPersonSchema(page: ExtractedPage): boolean {
  return page.schemaDetection.personSchema || hasSchemaType(page, "Person");
}

function hasSchemaType(page: ExtractedPage, type: string): boolean {
  return page.schemaTypes.some((schemaType) => schemaType.toLowerCase() === type.toLowerCase());
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
