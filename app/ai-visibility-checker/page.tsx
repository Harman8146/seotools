"use client";

import { Activity, AlertCircle, BarChart3, Bot, CheckCircle2, ChevronDown, Clipboard, Cpu, Download, FileJson, FileSearch, FileText, Network, Sparkles, Target, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import type { CSSProperties, ReactNode } from "react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { SiteNavbar } from "@/components/site-navbar";

type GeoSuggestion = {
  priority: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  recommendation: string;
  issue?: string;
  explanation?: string;
  whyItMatters?: string;
  seoImpact?: string;
  geoImpact?: string;
  priorityScore?: number;
  difficulty?: string;
};

type AuditIssue = Required<Pick<GeoSuggestion, "issue" | "explanation" | "recommendation">> & {
  priority: GeoSuggestion["priority"];
  category: string;
  whyItMatters: string;
  seoImpact: string;
  geoImpact: string;
  priorityScore: number;
  difficulty: string;
  affectedUrls: string[];
};

type PageAnalysis = {
  url: string;
  geoScore: number;
  aiVisibilityScore: number;
  contentQualityScore: number;
  technicalSeoScore: number;
  citationProbabilityScore?: number;
  aiTrustScore?: number;
  aiExtractionQuality?: number;
  contentCompletenessScore?: number;
  topicCoverageScore?: number;
  featuredSnippetScore?: number;
  issueCount: number;
  schemaCount: number;
  wordCount: number;
  headingStructureQuality: number;
  aiAnswerPreview?: string;
  searchIntent?: {
    primaryIntent: string;
    detectedIntents: string[];
    mismatchWarning?: string;
  };
  chunkOptimization?: {
    score: number;
    oversizedParagraphs: number;
    missingSubheadingSignals: number;
    scanability: string;
    recommendations: string[];
  };
  entityCoverage?: {
    detectedEntities: string[];
    weakEntities: string[];
    missingEntities: string[];
    semanticRelationships: string[];
  };
  topicalGaps?: {
    missingTopics: string[];
    missingEntities: string[];
    missingRelationships: string[];
  };
  faqOpportunities?: string[];
  readabilityHeatmap?: Array<{
    type: string;
    label: string;
    text: string;
    score: number;
    tone: "weak" | "average" | "strong";
    reason: string;
  }>;
  featuredSnippetOpportunities?: string[];
  strengths?: string[];
  weaknesses?: string[];
  contentQualityScores?: {
    headingQuality: number;
    readability: number;
    semanticDepth: number;
    aiFriendliness: number;
    geoFormatting: number;
    contentCompleteness: number;
  };
  contentIssues?: Array<{
    type: string;
    affectedSection: string;
    currentText: string;
    issue: string;
    explanation: string;
    recommendation: string;
    priority: "Critical" | "High" | "Medium" | "Low";
  }>;
};

type GeoResult = {
  geoScore: number;
  strengths: string[];
  weaknesses: string[];
  opportunities?: string[];
  criticalIssues?: AuditIssue[];
  aiOptimizationOpportunities?: AuditIssue[];
  technicalImprovements?: AuditIssue[];
  contentImprovements?: AuditIssue[];
  suggestions: GeoSuggestion[];
  scores?: {
    geoScore: number;
    aiVisibilityScore: number;
    technicalSeoScore: number;
    contentQualityScore: number;
    eeatScore: number;
    aiAccessibilityScore: number;
    citationProbabilityScore?: number;
  };
  advancedAnalytics?: {
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
  pageAnalysis?: PageAnalysis[];
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
    aiCrawlerAccess?: Array<{ crawler: string; status: string; matchedRules: string[] }>;
    schemaTypesDetected?: string[];
    duplicateTitles?: string[];
    duplicateDescriptions?: string[];
    analyzedUrls: string[];
    schemaDetection?: {
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
  };
};

const loadingStatuses = [
  "Checking schema markup...",
  "Analyzing AI readability...",
  "Detecting FAQ structure...",
  "Scanning internal links...",
  "Evaluating semantic SEO...",
  "Checking GPTBot accessibility...",
  "Validating llms.txt...",
  "Measuring E-E-A-T signals...",
  "Processing content structure...",
  "Calculating GEO score...",
];

export default function GeoPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingSucceeded, setLoadingSucceeded] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GeoResult | null>(null);
  const [expandedPage, setExpandedPage] = useState<string | null>(null);
  const resultsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!showLoadingModal || loadingSucceeded) {
      return;
    }

    const statusTimer = window.setInterval(() => {
      setStatusIndex((current) => (current + 1) % loadingStatuses.length);
    }, 2400);

    const progressTimer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 92) {
          return current;
        }
        const nextStep = current < 35 ? 5 : current < 70 ? 3 : 1;
        return Math.min(current + nextStep, 92);
      });
    }, 650);

    return () => {
      window.clearInterval(statusTimer);
      window.clearInterval(progressTimer);
    };
  }, [showLoadingModal, loadingSucceeded]);

  const runAnalysis = async () => {
    if (loading) {
      return;
    }

    setError("");
    setResult(null);

    if (!url.trim()) {
      setError("Enter a website URL to analyze.");
      return;
    }

    setLoading(true);
    setShowLoadingModal(true);
    setLoadingSucceeded(false);
    setStatusIndex(0);
    setProgress(8);

    try {
      const response = await fetch("/api/geo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "GEO analysis failed.");
      }

      setResult(data);
      setProgress(100);
      setLoadingSucceeded(true);

      window.setTimeout(() => {
        setShowLoadingModal(false);
        window.setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }, 1050);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "GEO analysis failed.");
      setShowLoadingModal(false);
    } finally {
      setLoading(false);
    }
  };

  const copyReport = useCallback(async () => {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  }, [result]);

  const downloadJsonReport = useCallback(() => {
    if (!result) return;
    downloadFile(`geo-audit-${Date.now()}.json`, JSON.stringify(result, null, 2), "application/json");
  }, [result]);

  const downloadTextReport = useCallback(() => {
    if (!result) return;
    const report = [
      "AI Visibility Checker Report",
      `GEO Score: ${result.geoScore}/100`,
      "",
      "Scores:",
      ...Object.entries(result.scores ?? { geoScore: result.geoScore }).map(([key, value]) => `${formatMetric(key)}: ${value}/100`),
      "",
      "Top Recommendations:",
      ...result.suggestions.map((suggestion, index) => `${index + 1}. ${suggestion.title}: ${suggestion.recommendation}`),
    ].join("\n");
    downloadFile(`geo-audit-${Date.now()}.txt`, report, "text/plain");
  }, [result]);

  const exportPdfReport = useCallback(() => {
    window.print();
  }, []);

  return (
    <>
    <SiteNavbar />
    <main className="geo-premium-page container-fluid px-3 px-sm-4 py-4 py-md-5 text-dark dark:text-light">
      <div className="premium-aurora" aria-hidden="true" />
      <div className="container" style={{ maxWidth: "980px" }}>
        {/* <header className="geo-hero-shell mb-5">
          <Link href="/" className="text-decoration-none small fw-semibold text-primary">
            Back to SEO GEO Platform
          </Link>
          <div className="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-4 mt-4">
            <div>
              <div className="d-inline-flex align-items-center gap-2 rounded-pill border px-3 py-2 small fw-bold text-primary bg-white shadow-sm">
                <Bot size={16} aria-hidden="true" />
                AI GEO Analyzer
                <span className="badge rounded-pill text-bg-primary">NEW</span>
              </div>
              <h1 className="display-5 fw-bold mt-3 mb-3">Generative Engine Optimization Analyzer</h1>
              <p className="lead opacity-75 mb-0">
                Audit how clearly AI search systems can crawl, understand, and cite your website.
              </p>
            </div>
          </div>
        </header> */}

         <h1 className="display-5 fw-bold mt-3 mb-3">Generative Engine Optimization Analyzer</h1>
        <p className="lead opacity-75 mb-0">
                Audit how clearly AI search systems can crawl, understand, and cite your website.
              </p>

        <section className="card border-0 shadow-sm mb-4" style={{ borderRadius: "20px" }}>
          <div className="card-body p-4 p-md-5">
            <label htmlFor="geo-url" className="form-label fw-bold small">
              WEBSITE URL
            </label>
            <div className="d-flex flex-column flex-md-row gap-3">
              <input
                id="geo-url"
                className="form-control form-control-lg"
                placeholder="https://example.com"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !loading) {
                    runAnalysis();
                  }
                }}
                disabled={loading}
              />
              <button
                type="button"
                className="btn btn-primary btn-lg fw-bold d-inline-flex align-items-center justify-content-center gap-2 px-4 geo-analyze-button"
                onClick={runAnalysis}
                aria-busy={loading}
                disabled={loading}
              >
                <Sparkles size={20} aria-hidden="true" />
                {loading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
            {error && (
              <div className="alert alert-warning d-flex align-items-center gap-2 mt-4 mb-0" role="alert">
                <TriangleAlert size={18} aria-hidden="true" />
                {error}
              </div>
            )}
          </div>
        </section>

       

        <AnimatePresence>
          {loading && <LoadingSkeletons />}
        </AnimatePresence>

        {result && (
          <motion.section
            ref={resultsRef}
            className="geo-results"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="row g-4 mb-4">
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow-sm geo-dashboard-card premium-gradient-border">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-2 small fw-bold text-primary mb-3">
                      <Activity size={18} aria-hidden="true" />
                      GEO Score
                    </div>
                    <div className="display-3 fw-bold">{result.geoScore}</div>
                    <p className="small opacity-75 mb-0">out of 100 across AI visibility signals</p>
                  </div>
                </div>
              </div>
              <div className="col-md-8">
                <div className="card h-100 border-0 shadow-sm geo-dashboard-card">
                  <div className="card-body p-4">
                    <h2 className="h5 fw-bold mb-3">Technical Findings</h2>
                    <div className="row g-3 small">
                      <Finding label="Pages crawled" value={String(result.technicalFindings.crawledPages)} />
                      <Finding label="robots.txt" value={result.technicalFindings.robotsTxt.found ? "Found" : "Not found"} />
                      <Finding label="llms.txt" value={result.technicalFindings.llmsTxt.found ? "Found" : "Not found"} />
                      <Finding label="Failed pages" value={String(result.technicalFindings.failedPages.length)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {result.scores && (
              <div className="row g-4 mb-4">
                {Object.entries(result.scores).map(([label, value]) => (
                  <ScoreCard key={label} label={formatMetric(label)} value={value} />
                ))}
              </div>
            )}

            {result.advancedAnalytics && (
              <AdvancedAnalyticsPanel analytics={result.advancedAnalytics} />
            )}

            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                  <div>
                    <h2 className="h5 fw-bold mb-1">Export Audit Report</h2>
                    <p className="small opacity-75 mb-0">Copy, download JSON, or save a text audit summary for clients and implementation teams.</p>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <button type="button" className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2" onClick={copyReport}>
                      <Clipboard size={16} /> Copy Report
                    </button>
                    <button type="button" className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2" onClick={downloadJsonReport}>
                      <FileJson size={16} /> JSON Export
                    </button>
                    <button type="button" className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2" onClick={exportPdfReport}>
                      <FileText size={16} /> PDF Export
                    </button>
                    <button type="button" className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2" onClick={downloadTextReport}>
                      <Download size={16} /> Download Report
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {result.technicalFindings.aiCrawlerAccess && (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">
                  <h2 className="h5 fw-bold mb-3">AI Crawler Accessibility</h2>
                  <div className="d-flex flex-wrap gap-2">
                    {result.technicalFindings.aiCrawlerAccess.map((crawler) => (
                      <span key={crawler.crawler} className={`badge rounded-pill px-3 py-2 ${crawlerBadgeClass(crawler.status)}`}>
                        {crawler.crawler}: {crawler.status}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {result.technicalFindings.schemaDetection && (
              <SchemaInsightsPanel schema={result.technicalFindings.schemaDetection} />
            )}

            <div className="row g-4">
              <ResultList title="Strengths" items={result.strengths} tone="success" />
              <ResultList title="Weaknesses" items={result.weaknesses} tone="warning" />
            </div>

            {result.opportunities && result.opportunities.length > 0 && (
              <div className="card border-0 shadow-sm mt-4">
                <div className="card-body p-4">
                  <h2 className="h5 fw-bold mb-3">AI Optimization Opportunities</h2>
                  <ul className="list-unstyled d-grid gap-2 mb-0">
                    {result.opportunities.map((item) => (
                      <li key={item} className="d-flex align-items-start gap-2">
                        <Sparkles className="mt-1 text-primary" size={18} aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="card border-0 shadow-sm mt-4">
              <div className="card-body p-4">
                <h2 className="h5 fw-bold mb-3">Smart Rule-Based Audit Issues</h2>
                <div className="d-grid gap-3">
                  {result.suggestions.map((suggestion) => (
                    <article key={`${suggestion.category}-${suggestion.title}`} className="border rounded-3 p-3">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className={`badge rounded-pill ${badgeClass(suggestion.priority)}`}>
                          {suggestion.priority}
                        </span>
                        <strong>{suggestion.title}</strong>
                        {suggestion.priorityScore && <span className="badge rounded-pill text-bg-light border">Priority {suggestion.priorityScore}</span>}
                      </div>
                      {suggestion.explanation && <p className="mb-2 small">{suggestion.explanation}</p>}
                      {suggestion.whyItMatters && <p className="mb-2 small opacity-75"><strong>Why it matters:</strong> {suggestion.whyItMatters}</p>}
                      {(suggestion.seoImpact || suggestion.geoImpact || suggestion.difficulty) && (
                        <div className="d-flex flex-wrap gap-2 mb-2">
                          {suggestion.seoImpact && <span className="badge text-bg-secondary">SEO: {suggestion.seoImpact}</span>}
                          {suggestion.geoImpact && <span className="badge text-bg-primary">GEO: {suggestion.geoImpact}</span>}
                          {suggestion.difficulty && <span className="badge text-bg-light border">Difficulty: {suggestion.difficulty}</span>}
                        </div>
                      )}
                      <p className="mb-0 small opacity-75">{suggestion.recommendation}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            {result.pageAnalysis && result.pageAnalysis.length > 0 && (
              <div className="card border-0 shadow-sm mt-4">
                <div className="card-body p-4">
                  <h2 className="h5 fw-bold mb-2">Page-Level & Content-Block Analysis</h2>
                  <p className="small opacity-75 mb-4">
                    Expand each page to see weak headings, thin paragraphs, missing sections, semantic gaps, and exact GEO improvement tips.
                  </p>
                  <div className="d-grid gap-3">
                    {result.pageAnalysis.map((page) => (
                      <PageAuditCard
                        key={page.url}
                        page={page}
                        expanded={expandedPage === page.url}
                        onToggle={() => setExpandedPage((current) => (current === page.url ? null : page.url))}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.section>
        )}

        <AnimatePresence>
          {showLoadingModal && (
            <GeoLoadingModal
              progress={progress}
              status={loadingSucceeded ? "Analysis complete. Preparing your GEO report..." : loadingStatuses[statusIndex]}
              success={loadingSucceeded}
            />
          )}
        </AnimatePresence>

      </div>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>

      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <SiteFooter />
    </main>
    </>
  );
}

function GeoLoadingModal({ progress, status, success }: { progress: number; status: string; success: boolean }) {
  return (
    <motion.div
      className="geo-loading-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="geo-loading-title"
      aria-describedby="geo-loading-description"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      <motion.div
        className="geo-loading-modal"
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        <div className="geo-modal-grid" aria-hidden="true" />
        <div className="position-relative">
          <div className="d-flex justify-content-center mb-4">
            <div className={`geo-ai-spinner ${success ? "geo-ai-spinner-success" : ""}`}>
              <div className="geo-ai-spinner-ring" />
              <div className="geo-ai-spinner-core">
                {success ? <CheckCircle2 size={34} /> : <Bot size={34} />}
              </div>
            </div>
          </div>

          {/* <div className="text-center">
            <h2 id="geo-loading-title" className="h3 fw-bold mb-3">
              Analyzing Website GEO Score
            </h2>
            <p id="geo-loading-description" className="geo-loading-subtitle mx-auto mb-3">
              Please wait while we crawl and analyze your website for AI visibility, GEO optimization, technical SEO
              signals, semantic structure, entity clarity, schema markup, and AI crawler accessibility.
            </p>
            <p className="geo-loading-detail mx-auto mb-4">
              Our GEO engine is scanning your website structure, semantic relevance, AI accessibility, schema
              implementation, entity optimization, content readability, and technical SEO signals to generate a
              comprehensive AI visibility score and actionable optimization recommendations.
            </p>
          </div> */}

          <div className="geo-status-card mb-4">
            <div className="d-flex align-items-center gap-3">
              <div className="geo-status-icon">
                <FileSearch size={20} aria-hidden="true" />
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={status}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="fw-semibold"
                  aria-live="polite"
                >
                  {status}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-between small fw-bold mb-2">
            <span>Estimated progress</span>
            <motion.span key={progress} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}>
              {progress}%
            </motion.span>
          </div>
          <div className="geo-progress-track" aria-hidden="true">
            <motion.div
              className="geo-progress-fill"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
          </div>

          <div className="row g-3 mt-4">
            <AuditMiniCard icon={<Network size={18} />} title="Crawler" text="Internal pages and access signals" />
            <AuditMiniCard icon={<Cpu size={18} />} title="AI Signals" text="Entities, chunks, and semantic clarity" />
            <AuditMiniCard icon={<Activity size={18} />} title="Score Engine" text="Rule-based GEO recommendations" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const AdvancedAnalyticsPanel = memo(function AdvancedAnalyticsPanel({ analytics }: { analytics: NonNullable<GeoResult["advancedAnalytics"]> }) {
  return (
    <div className="d-grid gap-4 mb-4">
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
            <div>
              <div className="d-inline-flex align-items-center gap-2 small fw-bold text-primary mb-2">
                <BarChart3 size={18} aria-hidden="true" />
                Advanced GEO Intelligence
              </div>
              <h2 className="h5 fw-bold mb-1">AI Citation, Intent, Entity & Topical Gap Analysis</h2>
              <p className="small opacity-75 mb-0">{analytics.exportReadySummary}</p>
            </div>
            <div className="geo-citation-meter">
              <span className="small fw-bold opacity-75">Citation Probability</span>
              <strong>{analytics.citationProbability.score}%</strong>
              <span className={`badge rounded-pill ${analytics.citationProbability.label === "High" ? "text-bg-success" : analytics.citationProbability.label === "Medium" ? "text-bg-warning" : "text-bg-danger"}`}>
                {analytics.citationProbability.label}
              </span>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-lg-6">
              <InsightBox title="AI Answer Previews" icon={<Sparkles size={18} />}>
                <div className="d-grid gap-3">
                  {analytics.aiAnswerPreviews.map((item) => (
                    <div className="geo-insight-item" key={item.url}>
                      <div className="small fw-bold text-primary text-break mb-1">{item.url}</div>
                      <p className="small mb-0">{item.preview}</p>
                    </div>
                  ))}
                </div>
              </InsightBox>
            </div>
            <div className="col-lg-6">
              <InsightBox title="Citation Factors" icon={<Target size={18} />}>
                <MiniList title="Signals affecting AI citation potential" items={analytics.citationProbability.factors} tone="success" />
              </InsightBox>
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-lg-4">
              <InsightBox title="Topical Gaps" icon={<AlertCircle size={18} />}>
                <TagList items={analytics.topicalGapSummary.missingTopics} empty="No major topic gaps detected." tone="warning" />
              </InsightBox>
            </div>
            <div className="col-lg-4">
              <InsightBox title="Entity Coverage" icon={<Network size={18} />}>
                <TagList items={analytics.entityCoverageSummary.detectedEntities} empty="No clear entities detected." tone="success" />
                <div className="mt-3">
                  <div className="small fw-bold mb-2">Weak or Missing Entities</div>
                  <TagList items={[...analytics.entityCoverageSummary.weakEntities, ...analytics.entityCoverageSummary.missingEntities].slice(0, 10)} empty="Entity coverage looks solid." tone="warning" />
                </div>
              </InsightBox>
            </div>
            <div className="col-lg-4">
              <InsightBox title="Search Intent" icon={<FileSearch size={18} />}>
                <div className="d-grid gap-2">
                  {analytics.intentSummary.map((item) => (
                    <div className="d-flex align-items-center justify-content-between border rounded-3 p-2 small" key={item.intent}>
                      <strong>{item.intent}</strong>
                      <span className="badge text-bg-light border">{item.pages} page{item.pages === 1 ? "" : "s"}</span>
                    </div>
                  ))}
                </div>
              </InsightBox>
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-lg-6">
              <InsightBox title="FAQ Opportunity Generator" icon={<Clipboard size={18} />}>
                <ol className="small mb-0 d-grid gap-2">
                  {analytics.faqOpportunities.slice(0, 8).map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ol>
              </InsightBox>
            </div>
            <div className="col-lg-6">
              <InsightBox title="Internal Link Depth" icon={<Network size={18} />}>
                <MiniList title="Weakly linked pages" items={analytics.internalLinkDepth.weaklyLinkedPages.slice(0, 6)} tone="warning" />
                <div className="mt-3">
                  <MiniList title="Depth warnings" items={analytics.internalLinkDepth.depthWarnings} tone="warning" />
                </div>
              </InsightBox>
            </div>
          </div>

          <details className="geo-llms-box mt-3">
            <summary className="fw-bold">Recommended llms.txt</summary>
            <pre className="mb-0 mt-3">{analytics.llmsTxtRecommendation}</pre>
          </details>
        </div>
      </div>
    </div>
  );
});

function InsightBox({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="geo-insight-box h-100">
      <div className="d-flex align-items-center gap-2 fw-bold mb-3">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function TagList({ items, empty, tone }: { items: string[]; empty: string; tone: "success" | "warning" }) {
  if (items.length === 0) {
    return <p className="small opacity-75 mb-0">{empty}</p>;
  }

  return (
    <div className="d-flex flex-wrap gap-2">
      {items.map((item) => (
        <span className={`badge rounded-pill ${tone === "success" ? "text-bg-success" : "text-bg-warning"}`} key={item}>
          {item}
        </span>
      ))}
    </div>
  );
}

function AuditMiniCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="col-sm-6 col-lg-4">
      <div className="geo-audit-mini-card">
        <div className="d-flex align-items-center gap-2 fw-bold small mb-1">
          {icon}
          {title}
        </div>
        <div className="small opacity-75">{text}</div>
      </div>
    </div>
  );
}

function SchemaInsightsPanel({ schema }: { schema: NonNullable<GeoResult["technicalFindings"]["schemaDetection"]> }) {
  const readiness = schema.schemaDetected && schema.jsonLdInvalidBlocks === 0 && schema.incompleteFields.length === 0;
  const richResultItems = [
    ["FAQ schema", schema.faqSchema],
    ["Organization", schema.organizationSchema],
    ["LocalBusiness", schema.localBusinessSchema],
    ["Product", schema.productSchema],
    ["Breadcrumbs", schema.breadcrumbSchema],
    ["Article", schema.articleSchema],
  ] as const;

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-4">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
          <div>
            <div className="small fw-bold text-primary mb-1">Structured Data</div>
            <h2 className="h5 fw-bold mb-1">Schema Markup Insights</h2>
            <p className="small opacity-75 mb-0">
              {schema.schemaDetected
                ? `${schema.schemaCount} schema type${schema.schemaCount === 1 ? "" : "s"} detected across JSON-LD, Microdata, RDFa, and hydration scripts.`
                : "No supported schema markup was detected in the crawled HTML."}
            </p>
          </div>
          <span className={`badge rounded-pill align-self-start px-3 py-2 ${readiness ? "text-bg-success" : schema.schemaDetected ? "text-bg-warning" : "text-bg-danger"}`}>
            {readiness ? "Rich result ready" : schema.schemaDetected ? "Review schema" : "Schema missing"}
          </span>
        </div>

        <div className="row g-3 mb-3">
          <Finding label="Schema types" value={String(schema.schemaCount)} />
          <Finding label="JSON-LD blocks" value={`${schema.jsonLdValidBlocks}/${schema.jsonLdBlocks || schema.jsonLdValidBlocks} valid`} />
          <Finding label="Microdata items" value={String(schema.microdataItems)} />
          <Finding label="RDFa items" value={String(schema.rdfaItems)} />
        </div>

        {schema.schemaTypes.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mb-3">
            {schema.schemaTypes.map((type) => (
              <span className="badge rounded-pill text-bg-primary px-3 py-2" key={type}>
                {type}
              </span>
            ))}
          </div>
        )}

        <div className="row g-3">
          {richResultItems.map(([label, present]) => (
            <div className="col-sm-6 col-lg-4" key={label}>
              <div className="border rounded-3 p-3 h-100 d-flex align-items-center gap-2">
                {present ? <CheckCircle2 className="text-success" size={18} /> : <AlertCircle className="text-warning" size={18} />}
                <span className="small fw-bold">{label}: {present ? "Detected" : "Not detected"}</span>
              </div>
            </div>
          ))}
        </div>

        <details className="geo-llms-box mt-3">
          <summary className="fw-bold">Schema opportunities and warnings</summary>
          <div className="row g-3 mt-2">
            <SchemaMiniList title="Missing opportunities" items={schema.missingRecommendedSchema} empty="No major schema opportunities detected." />
            <SchemaMiniList title="Validation warnings" items={[...schema.invalidSchemaWarnings, ...schema.incompleteFields]} empty="No schema validation warnings detected." />
            <SchemaMiniList title="Recommendations" items={schema.recommendations} empty="Schema coverage looks solid." />
          </div>
        </details>
      </div>
    </div>
  );
}

function SchemaMiniList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="col-lg-4">
      <div className="border rounded-3 p-3 h-100">
        <div className="fw-bold small mb-2">{title}</div>
        {items.length > 0 ? (
          <ul className="small mb-0 ps-3">
            {items.slice(0, 6).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="small opacity-75 mb-0">{empty}</p>
        )}
      </div>
    </div>
  );
}

function LoadingSkeletons() {
  return (
    <motion.section
      className="row g-4 mb-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      aria-hidden="true"
    >
      {[0, 1, 2].map((item) => (
        <div className="col-sm-6 col-lg-4" key={item}>
          <div className="geo-skeleton-card">
            <div className="geo-skeleton-line geo-skeleton-short" />
            <div className="geo-skeleton-line geo-skeleton-tall" />
            <div className="geo-skeleton-line" />
            <div className="geo-skeleton-line geo-skeleton-medium" />
          </div>
        </div>
      ))}
    </motion.section>
  );
}

function Finding({ label, value }: { label: string; value: string }) {
  return (
    <div className="col-12 col-sm-6">
      <div className="border rounded-3 p-3 h-100">
        <div className="opacity-75">{label}</div>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

const ScoreCard = memo(function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="col-sm-6 col-xl-4">
      <motion.div className="card h-100 border-0 shadow-sm geo-dashboard-card premium-gradient-border" whileHover={{ y: -5 }}>
        <div className="card-body p-4 position-relative">
          <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
            <div>
              <h3 className="h6 fw-bold mb-1">{label}</h3>
              <div className="small opacity-75">{scoreLabel(value)}</div>
            </div>
            <motion.div
              className="geo-score-ring fw-black"
              style={{ "--score": value } as CSSProperties}
              initial={{ scale: 0.92, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35 }}
            >
              {value}
            </motion.div>
          </div>
          <div className="geo-progress-track">
            <div className="geo-progress-fill" style={{ width: `${value}%` }} />
          </div>
        </div>
      </motion.div>
    </div>
  );
});

const PageAuditCard = memo(function PageAuditCard({ page, expanded, onToggle }: { page: PageAnalysis; expanded: boolean; onToggle: () => void }) {
  const scores = page.contentQualityScores;
  const issues = page.contentIssues ?? [];

  return (
    <motion.article className="border rounded-4 p-3 bg-white bg-opacity-75">
      <button
        type="button"
        className="btn w-100 p-0 text-start border-0"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <div>
            <div className="small fw-bold text-primary mb-1 text-break">{page.url}</div>
            <div className="d-flex flex-wrap gap-2 small">
              <span className="badge text-bg-light border">Issues: {page.issueCount}</span>
              <span className="badge text-bg-light border">Words: {page.wordCount}</span>
              <span className="badge text-bg-light border">Schema: {page.schemaCount}</span>
            </div>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <ScorePill value={page.geoScore} />
            <span className="small opacity-75">GEO</span>
            <ScorePill value={page.aiVisibilityScore} />
            <span className="small opacity-75">AI</span>
            {page.citationProbabilityScore !== undefined && (
              <>
                <ScorePill value={page.citationProbabilityScore} />
                <span className="small opacity-75">Citation</span>
              </>
            )}
            <ChevronDown className={expanded ? "geo-chevron-open" : ""} size={18} aria-hidden="true" />
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              {page.aiAnswerPreview && (
                <div className="geo-ai-preview mb-4">
                  <div className="small fw-bold text-primary mb-2">AI Answer Preview</div>
                  <p className="mb-0">{page.aiAnswerPreview}</p>
                </div>
              )}

              {scores && (
                <div className="row g-3 mb-4">
                  {Object.entries(scores).map(([label, value]) => (
                    <div className="col-sm-6 col-lg-4" key={label}>
                      <div className="border rounded-3 p-3 h-100">
                        <div className="small fw-bold mb-2">{formatMetric(label)}</div>
                        <div className="d-flex align-items-center gap-2">
                          <ScorePill value={value} />
                          <div className="geo-progress-track flex-grow-1">
                            <div className="geo-progress-fill" style={{ width: `${value}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="row g-3 mb-4">
                {[
                  ["Citation Probability", page.citationProbabilityScore],
                  ["AI Trust", page.aiTrustScore],
                  ["AI Extraction", page.aiExtractionQuality],
                  ["Content Completeness", page.contentCompletenessScore],
                  ["Topic Coverage", page.topicCoverageScore],
                  ["Featured Snippet", page.featuredSnippetScore],
                ].filter(([, value]) => typeof value === "number").map(([label, value]) => (
                  <div className="col-sm-6 col-lg-4" key={String(label)}>
                    <div className="border rounded-3 p-3 h-100">
                      <div className="small fw-bold mb-2">{label}</div>
                      <ScorePill value={Number(value)} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="row g-3 mb-4">
                {page.searchIntent && (
                  <div className="col-lg-4">
                    <InsightBox title="AI Search Intent" icon={<Target size={18} />}>
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {page.searchIntent.detectedIntents.map((intent) => (
                          <span className="badge text-bg-primary" key={intent}>{intent}</span>
                        ))}
                      </div>
                      {page.searchIntent.mismatchWarning && <p className="small text-warning-emphasis mb-0">{page.searchIntent.mismatchWarning}</p>}
                    </InsightBox>
                  </div>
                )}
                {page.chunkOptimization && (
                  <div className="col-lg-4">
                    <InsightBox title="AI Chunk Optimization" icon={<Cpu size={18} />}>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <ScorePill value={page.chunkOptimization.score} />
                        <span className="small">{page.chunkOptimization.scanability} scanability</span>
                      </div>
                      <MiniList title="Chunk fixes" items={page.chunkOptimization.recommendations} tone="warning" />
                    </InsightBox>
                  </div>
                )}
                {page.entityCoverage && (
                  <div className="col-lg-4">
                    <InsightBox title="Entity Coverage" icon={<Network size={18} />}>
                      <TagList items={page.entityCoverage.detectedEntities.slice(0, 8)} empty="No entities detected." tone="success" />
                      <div className="mt-3">
                        <TagList items={[...page.entityCoverage.weakEntities, ...page.entityCoverage.missingEntities].slice(0, 8)} empty="No weak entities detected." tone="warning" />
                      </div>
                    </InsightBox>
                  </div>
                )}
              </div>

              {(page.topicalGaps || page.faqOpportunities || page.featuredSnippetOpportunities) && (
                <div className="row g-3 mb-4">
                  <div className="col-lg-4">
                    <InsightBox title="Topical Gap Analysis" icon={<AlertCircle size={18} />}>
                      <TagList items={page.topicalGaps?.missingTopics ?? []} empty="No major missing topics." tone="warning" />
                    </InsightBox>
                  </div>
                  <div className="col-lg-4">
                    <InsightBox title="FAQ Opportunities" icon={<Clipboard size={18} />}>
                      <MiniList title="Suggested FAQs" items={page.faqOpportunities ?? []} tone="success" />
                    </InsightBox>
                  </div>
                  <div className="col-lg-4">
                    <InsightBox title="Snippet Optimization" icon={<FileText size={18} />}>
                      <MiniList title="Recommended formats" items={page.featuredSnippetOpportunities ?? []} tone="success" />
                    </InsightBox>
                  </div>
                </div>
              )}

              {page.readabilityHeatmap && page.readabilityHeatmap.length > 0 && (
                <div className="mb-4">
                  <h3 className="h6 fw-bold mb-3">AI Readability Heatmap</h3>
                  <div className="geo-heatmap-grid">
                    {page.readabilityHeatmap.map((item, index) => (
                      <div className={`geo-heatmap-item geo-heatmap-${item.tone}`} key={`${item.label}-${index}`}>
                        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                          <strong className="small">{item.label}</strong>
                          <ScorePill value={item.score} />
                        </div>
                        <p className="small mb-2">{item.text}</p>
                        <div className="small opacity-75">{item.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <MiniList title="Page Strengths" items={page.strengths ?? []} tone="success" />
                </div>
                <div className="col-md-6">
                  <MiniList title="Page Weaknesses" items={page.weaknesses ?? []} tone="warning" />
                </div>
              </div>

              <h3 className="h6 fw-bold mb-3">Weak Content Blocks & Fixes</h3>
              <div className="d-grid gap-3">
                {issues.length > 0 ? (
                  issues.map((issue, index) => (
                    <div key={`${issue.affectedSection}-${issue.issue}-${index}`} className={`geo-content-issue geo-content-issue-${issue.priority.toLowerCase()}`}>
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                        <AlertCircle size={18} aria-hidden="true" />
                        <span className={`badge rounded-pill ${contentPriorityClass(issue.priority)}`}>{issue.priority}</span>
                        <strong>{issue.type}</strong>
                        <span className="small opacity-75">{issue.affectedSection}</span>
                      </div>
                      <div className="geo-highlight-block mb-2">{issue.currentText}</div>
                      <p className="small mb-2"><strong>Issue:</strong> {issue.issue}</p>
                      <p className="small mb-2"><strong>Why it is weak:</strong> {issue.explanation}</p>
                      <p className="small mb-0"><strong>How to improve:</strong> {issue.recommendation}</p>
                    </div>
                  ))
                ) : (
                  <p className="small opacity-75 mb-0">No major content-block issues detected for this page.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        
      </AnimatePresence>
      
    </motion.article>



  );

  
});

const MiniList = memo(function MiniList({ title, items, tone }: { title: string; items: string[]; tone: "success" | "warning" }) {
  return (
    <div className="border rounded-3 p-3 h-100">
      <div className="fw-bold small mb-2">{title}</div>
      {items.length > 0 ? (
        <ul className="list-unstyled d-grid gap-2 mb-0 small">
          {items.map((item) => (
            <li className="d-flex gap-2" key={item}>
              <CheckCircle2 className={`mt-1 text-${tone}`} size={16} aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="small opacity-75 mb-0">No items detected.</p>
      )}
    </div>
  );
});

function ScorePill({ value }: { value: number }) {
  return <span className={`badge rounded-pill ${value >= 80 ? "text-bg-success" : value >= 60 ? "text-bg-warning" : "text-bg-danger"}`}>{value}</span>;
}

function scoreLabel(value: number): string {
  if (value >= 85) return "Enterprise-ready";
  if (value >= 70) return "Strong signal";
  if (value >= 55) return "Needs refinement";
  return "High priority";
}

const ResultList = memo(function ResultList({ title, items, tone }: { title: string; items: string[]; tone: "success" | "warning" }) {
  return (
    <div className="col-md-6">
      <div className="card h-100 border-0 shadow-sm">
        <div className="card-body p-4">
          <h2 className="h5 fw-bold mb-3">{title}</h2>
          {items.length > 0 ? (
            <ul className="list-unstyled d-grid gap-2 mb-0">
              {items.map((item) => (
                <li key={item} className="d-flex align-items-start gap-2">
                  <CheckCircle2 className={`mt-1 text-${tone}`} size={18} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small opacity-75 mb-0">No major {title.toLowerCase()} found yet.</p>
          )}
        </div>
      </div>
    </div>
  );

  
});



function badgeClass(priority: GeoSuggestion["priority"]): string {
  if (priority === "critical") return "text-bg-danger";
  if (priority === "high") return "text-bg-danger";
  if (priority === "medium") return "text-bg-warning";
  return "text-bg-secondary";
}

function crawlerBadgeClass(status: string): string {
  if (status === "allowed") return "text-bg-success";
  if (status === "blocked") return "text-bg-danger";
  return "text-bg-warning";
}

function contentPriorityClass(priority: "Critical" | "High" | "Medium" | "Low"): string {
  if (priority === "Critical") return "text-bg-danger";
  if (priority === "High") return "text-bg-danger";
  if (priority === "Medium") return "text-bg-warning";
  return "text-bg-secondary";
}

function formatMetric(value: string): string {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase())
    .replace("Geo", "GEO")
    .replace("Ai", "AI")
    .replace("Seo", "SEO")
    .trim();
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
