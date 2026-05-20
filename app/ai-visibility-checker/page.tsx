"use client";

import { Activity, Bot, CheckCircle2, Cpu, FileSearch, Network, Sparkles, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { SiteNavbar } from "@/components/site-navbar";

type GeoSuggestion = {
  priority: "high" | "medium" | "low";
  category: string;
  title: string;
  recommendation: string;
};

type GeoResult = {
  geoScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: GeoSuggestion[];
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
    analyzedUrls: string[];
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

  return (
    <>
    <SiteNavbar />
    <main className="container-fluid py-5 text-dark dark:text-light">
      <div className="container" style={{ maxWidth: "980px" }}>
        <header className="mb-5">
          <Link href="/" className="text-decoration-none small fw-semibold text-primary">
            Back to Local SERP Checker
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
        </header>

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
                <div className="card h-100 border-0 shadow-sm">
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
                <div className="card h-100 border-0 shadow-sm">
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

            <div className="row g-4">
              <ResultList title="Strengths" items={result.strengths} tone="success" />
              <ResultList title="Weaknesses" items={result.weaknesses} tone="warning" />
            </div>

            <div className="card border-0 shadow-sm mt-4">
              <div className="card-body p-4">
                <h2 className="h5 fw-bold mb-3">Rule-Based AI Suggestions</h2>
                <div className="d-grid gap-3">
                  {result.suggestions.map((suggestion) => (
                    <article key={`${suggestion.category}-${suggestion.title}`} className="border rounded-3 p-3">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className={`badge rounded-pill ${badgeClass(suggestion.priority)}`}>
                          {suggestion.priority}
                        </span>
                        <strong>{suggestion.title}</strong>
                      </div>
                      <p className="mb-0 small opacity-75">{suggestion.recommendation}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
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

        <footer className="mt-5 pt-5 border-top">
          <nav className="d-flex flex-wrap justify-content-center gap-3 small" aria-label="Footer navigation">
            <Link href="/" className="text-decoration-none opacity-75 geo-nav-link">
              SERP Checker
            </Link>
            {/* <Link href="/ai-visibility-checker" aria-current="page" className="text-decoration-none fw-bold text-primary geo-nav-link">
              <Bot size={15} aria-hidden="true" /> GEO Analyzer <span className="badge rounded-pill text-bg-primary ms-1">AI</span>
            </Link> */}
            <Link href="/privacy" className="text-decoration-none opacity-75 geo-nav-link">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-decoration-none opacity-75 geo-nav-link">
              Terms & Conditions
            </Link>
            <Link href="/about" className="text-decoration-none opacity-75 geo-nav-link">
              About
            </Link>
          </nav>
        </footer>
      </div>
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

          <div className="text-center">
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
          </div>

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

function AuditMiniCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="col-md-4">
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
        <div className="col-md-4" key={item}>
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
    <div className="col-6">
      <div className="border rounded-3 p-3 h-100">
        <div className="opacity-75">{label}</div>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function ResultList({ title, items, tone }: { title: string; items: string[]; tone: "success" | "warning" }) {
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
}

function badgeClass(priority: GeoSuggestion["priority"]): string {
  if (priority === "high") return "text-bg-danger";
  if (priority === "medium") return "text-bg-warning";
  return "text-bg-secondary";
}
