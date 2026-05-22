"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  Gauge,
  Newspaper,
  Network,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import Link from "next/link"; 
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { useEffect, useMemo, useState } from "react";

const features = [
  {
    title: "SEO Analysis",
    text: "Audit metadata, discoverability, structure, and technical quality from a search engine perspective.",
    icon: Search,
  },
  {
    title: "GEO Scoring",
    text: "Measure how clearly generative engines can understand, summarize, and recommend your pages.",
    icon: Gauge,
  },
  {
    title: "AI Visibility",
    text: "Find content gaps that affect AI answers, citations, retrieval quality, and brand clarity.",
    icon: Sparkles,
  },
  {
    title: "Schema Detection",
    text: "Inspect structured data, JSON-LD, FAQ signals, organization schema, and semantic markup.",
    icon: Workflow,
  },
  {
    title: "Technical SEO",
    text: "Review canonical tags, robots directives, internal links, page accessibility, and crawl signals.",
    icon: ShieldCheck,
  },
  {
    title: "AI Crawler Monitoring",
    text: "Check llms.txt, GPTBot accessibility, crawl readiness, and AI-friendly content formatting.",
    icon: Bot,
  },
];

const steps = [
  "Enter Website URL",
  "AI Analysis & Crawling",
  "Get SEO + GEO Recommendations",
];

type UpdateCategory = "All" | "SEO" | "GEO" | "AI Search" | "Google Update" | "ChatGPT" | "Gemini" | "Technical SEO";

type IndustryUpdate = {
  title: string;
  summary: string;
  category: Exclude<UpdateCategory, "All">;
  publishedAt: string;
  source: string;
  url: string;
};

const updateFeeds = [
  { source: "Google Search Central", category: "Google Update" as const, feed: "https://feeds.feedburner.com/blogspot/amDG" },
  { source: "Search Engine Journal", category: "SEO" as const, feed: "https://www.searchenginejournal.com/feed/" },
  { source: "Search Engine Land", category: "SEO" as const, feed: "https://searchengineland.com/feed" },
  { source: "OpenAI News", category: "ChatGPT" as const, feed: "https://openai.com/news/rss.xml" },
];

const fallbackUpdates: IndustryUpdate[] = [
  {
    title: "Google Search Central publishes official search and structured data updates",
    summary: "Track crawling, indexing, ranking systems, Search Console, structured data, and AI-era search guidance from Google's official SEO channel.",
    category: "Google Update",
    publishedAt: "Cached source",
    source: "Google Search Central",
    url: "https://developers.google.com/search/blog",
  },
  {
    title: "AI search visibility is becoming a measurable SEO workflow",
    summary: "Teams are auditing answer extraction, entities, citations, crawler access, and page-level content gaps as part of modern GEO programs.",
    category: "GEO",
    publishedAt: "Cached source",
    source: "GEO Trends",
    url: "/ai-visibility-checker",
  },
  {
    title: "OpenAI product updates continue to shape ChatGPT search behavior",
    summary: "Monitor model, product, and search-related announcements to understand how conversational discovery may affect brand visibility.",
    category: "ChatGPT",
    publishedAt: "Cached source",
    source: "OpenAI",
    url: "https://openai.com/news/",
  },
  {
    title: "Technical SEO remains foundational for AI crawler access",
    summary: "Robots directives, canonical URLs, internal links, schema, and page readability continue to influence how machines retrieve content.",
    category: "Technical SEO",
    publishedAt: "Cached source",
    source: "SEO GEO Platform",
    url: "/ai-visibility-checker",
  },
];

const updateCategories: UpdateCategory[] = ["All", "SEO", "GEO", "AI Search", "Google Update", "ChatGPT", "Gemini", "Technical SEO"];

export default function Home() {
  const [updates, setUpdates] = useState<IndustryUpdate[]>(fallbackUpdates);
  const [updatesLoading, setUpdatesLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<UpdateCategory>("All");

  useEffect(() => {
    let cancelled = false;
    const cacheKey = "seo-ai-industry-updates-v1";
    const cached = readUpdatesCache(cacheKey);

    if (cached.length > 0) {
      setUpdates(cached);
      setUpdatesLoading(false);
      return;
    }

    async function loadUpdates() {
      try {
        const loaded = await Promise.all(updateFeeds.map(fetchFeedUpdates));
        const merged = loaded.flat().sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 12);
        if (!cancelled && merged.length > 0) {
          setUpdates(merged);
          localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), updates: merged }));
        }
      } catch {
        if (!cancelled) {
          setUpdates(fallbackUpdates);
        }
      } finally {
        if (!cancelled) {
          setUpdatesLoading(false);
        }
      }
    }

    const runWhenIdle = () => {
      if ("requestIdleCallback" in window) {
        const idleId = window.requestIdleCallback(loadUpdates, { timeout: 2200 });
        return () => window.cancelIdleCallback(idleId);
      }

      const timer = setTimeout(loadUpdates, 900);
      return () => clearTimeout(timer);
    };

    const cancelIdle = runWhenIdle();

    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, []);

  const filteredUpdates = useMemo(() => {
    if (activeCategory === "All") return updates;
    return updates.filter((item) => item.category === activeCategory);
  }, [activeCategory, updates]);

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#e0e7ff_0%,#f8fafc_38%,#ffffff_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_top,#0f172a_0%,#020617_58%,#000000_100%)] dark:text-white">
      <SiteNavbar />

      <section className="relative px-4 pb-20 pt-16 md:pb-28 md:pt-24">
        <div className="absolute inset-x-0 top-0 -z-0 h-[520px] bg-[linear-gradient(135deg,rgba(37,99,235,0.14),rgba(14,165,233,0.08),transparent_70%)]" />
        <div className="premium-aurora" aria-hidden="true" />
        <motion.div
          className="absolute left-0 top-28 h-44 w-full -skew-y-6 bg-gradient-to-r from-blue-500/10 via-sky-400/10 to-indigo-500/10 blur-2xl"
          animate={{ x: [0, 18, 0], opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.04fr_0.96fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="home-glass-panel mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-sky-300">
              <Sparkles size={16} aria-hidden="true" />
              AI search visibility meets technical SEO
            </div>
              <h1 className="max-w-4xl text-[clamp(2.5rem,10vw,4.75rem)] font-black leading-[1.04] tracking-tight">
                AI-Powered SEO & GEO Optimization Platform
              </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl dark:text-slate-300">
              Analyze technical SEO, AI visibility, GEO optimization, semantic structure, and search performance with
              modern AI-focused auditing tools.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaButton href="/seo" label="Ranking Checker" icon={<Search size={19} />} secondary/>
              <CtaButton href="/ai-visibility-checker" label="Analyze GEO" icon={<Bot size={19} />} secondary />
            </div>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {["100k+ locations", "Rule-based AI audit", "No login required"].map((item, index) => (
                <motion.div
                  key={item}
                  className="home-glass-card rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 4 + index, repeat: Infinity, ease: "easeInOut" }}
                >
                  {item}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <DashboardPreview />
        </div>
      </section>
<IndustryUpdatesSection
        updates={filteredUpdates}
        loading={updatesLoading}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <SectionShell eyebrow="Platform Features" title="Everything you need to improve search and AI visibility">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                className="home-glass-card group rounded-2xl border border-slate-300 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_22px_70px_rgba(37,99,235,0.16)] dark:border-slate-700 dark:bg-slate-900"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.36, delay: index * 0.04 }}
              >
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-sky-400/10 dark:text-sky-300">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <h3 className="text-lg font-black">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{feature.text}</p>
              </motion.article>
            );
          })}
        </div>
      </SectionShell>

      <SectionShell eyebrow="How It Works" title="From URL to prioritized recommendations in minutes">
        <div className="relative grid gap-5 md:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-blue-200 via-sky-300 to-indigo-200 md:block dark:from-slate-700 dark:via-sky-700 dark:to-slate-700" />
          {steps.map((step, index) => (
            <motion.div
              key={step}
              className="home-glass-card relative rounded-2xl border border-slate-300 bg-white p-6 text-center shadow-lg dark:border-slate-700 dark:bg-slate-900"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.38, delay: index * 0.08 }}
            >
              <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-2xl font-black text-white shadow-xl shadow-blue-500/25">
                {index + 1}
              </div>
              <h3 className="text-xl font-black">{step}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {index === 0 && "Paste any website URL and choose the audit path that matches your growth objective."}
                {index === 1 && "The platform crawls pages, reads structure, checks schema, and evaluates AI readiness."}
                {index === 2 && "Receive a clear score, strengths, weaknesses, and practical optimization actions."}
              </p>
            </motion.div>
          ))}
        </div>
      </SectionShell>

      <SectionShell eyebrow="Tools" title="Two focused tools for the new search landscape">
        <div className="grid gap-6 lg:grid-cols-2">
          <ToolCard
            title="SEO Tool"
            href="/seo"
            button="Open Ranking Checker"
            icon={<Search size={24}   /> }
            bullets={["Local Ranking Checker", "Local Pack Checker", "local search simulation", "GMB Monitoring"]}
          />
          <ToolCard
            title="GEO Analyzer"
            href="/ai-visibility-checker"
            button="Open GEO Analyzer"
            icon={<Bot size={24} />}
            bullets={["AI visibility scoring", "GPTBot checks", "Semantic SEO", "Entity optimization", "llms.txt analysis"]}
            featured
          />
        </div>
      </SectionShell>

      

      <section className="px-4 py-16 md:py-24">
        <motion.div
          className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/60 bg-slate-950 p-8 text-white shadow-[0_30px_90px_rgba(15,23,42,0.28)] md:p-12"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.42 }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(37,99,235,0.28),rgba(14,165,233,0.16),transparent)] blur-3xl" aria-hidden="true" />
            <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              <div>
                <h2 className="max-w-2xl text-3xl font-black tracking-tight md:text-5xl">
                  Optimize Your Website for Search Engines and AI Systems
                </h2>
                <p className="mt-4 max-w-2xl text-slate-300">
                  Build stronger organic visibility, cleaner technical signals, and AI-ready content that modern answer
                  engines can understand.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                {/* <CtaButton href="/seo" label="Start SEO Audit" icon={<FileSearch size={18} />} light /> */}
                <CtaButton href="/ai-visibility-checker" label="Run GEO Analysis" icon={<Sparkles size={18} />} secondary light />
              </div>
            </div>
          </div>
        </motion.div>
      </section>
      <SiteFooter />
    </main>
  );
}

function SectionShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 py-14 md:py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mb-10 max-w-3xl"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.35 }}
        >
          <p className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-blue-700 dark:text-sky-300">{eyebrow}</p>
          <h2 className="text-3xl font-black tracking-tight md:text-5xl">{title}</h2>
        </motion.div>
        {children}
      </div>
    </section>
  );
}

function CtaButton({
  href,
  label,
  icon,
  secondary = false,
  light = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  secondary?: boolean;
  light?: boolean;
}) {
  const className = secondary
    ? "border border-slate-200 bg-white text-slate-950 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-sky-400"
    : light
      ? "bg-white text-slate-950 hover:bg-blue-50"
      : "bg-slate-950 text-white hover:bg-blue-700 dark:bg-white dark:text-slate-950";

  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
      <Link
        href={href}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-decoration-none shadow-lg transition sm:w-auto ${className}`}
      >
        {icon}
        {label}
        <ArrowRight size={17} aria-hidden="true" />
      </Link>
    </motion.div>
  );
}

function DashboardPreview() {
  return (
    <motion.div
      className="home-glass-panel rounded-3xl border border-slate-300 bg-white p-4 shadow-[0_30px_90px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-900"
      initial={{ opacity: 0, y: 30, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.65, delay: 0.12 }}
    >
      <div className="rounded-2xl bg-slate-950 p-4 text-white">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-400" />
            <span className="h-3 w-3 rounded-full bg-amber-300" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-bold text-sky-300">Live Audit</span>
        </div>
        <div className="grid gap-4 md:grid-cols-[0.72fr_1fr]">
          <div className="rounded-2xl bg-slate-800 p-4">
            <div className="text-sm text-slate-400">GEO Score</div>
            <div className="mt-2 text-5xl font-black">87</div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-700">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-300"
                initial={{ width: "18%" }}
                animate={{ width: "87%" }}
                transition={{ duration: 1.2, delay: 0.4 }}
              />
            </div>
          </div>
          <div className="grid gap-3">
            {[
              ["Schema", "Detected", CheckCircle2],
              ["Internal links", "Scanned", Network],
              ["AI readability", "Strong", Activity],
            ].map(([label, value, Icon]) => (
              <div key={label as string} className="flex items-center justify-between rounded-2xl bg-slate-800 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-400/10 text-sky-300">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="font-bold">{label as string}</span>
                </div>
                <span className="text-sm font-bold text-emerald-300">{value as string}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ToolCard({
  title,
  href,
  button,
  bullets,
  icon,
  featured = false,
}: {
  title: string;
  href: string;
  button: string;
  bullets: string[];
  icon: React.ReactNode;
  featured?: boolean;
}) {
  return (
    <motion.article
      className={`home-glass-card rounded-3xl border p-7 shadow-[0_24px_70px_rgba(15,23,42,0.10)] ${
        featured
          ? "border-blue-200 bg-white dark:border-slate-700 dark:bg-slate-900"
          : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
      }`}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
    >
      <div className="mb-6 inline-grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
        {icon}
      </div>
      <h3 className="text-2xl font-black">{title}</h3>
      <ul className="mt-5 grid gap-3">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <CheckCircle2 className="text-blue-600 dark:text-sky-300" size={18} aria-hidden="true" />
            {bullet}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white text-decoration-none shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
      >
        {button}
        <ArrowRight size={17} aria-hidden="true" />
      </Link>
    </motion.article>
  );
}

function IndustryUpdatesSection({
  updates,
  loading,
  activeCategory,
  onCategoryChange,
}: {
  updates: IndustryUpdate[];
  loading: boolean;
  activeCategory: UpdateCategory;
  onCategoryChange: (category: UpdateCategory) => void;
}) {
  return (
    <section className="relative px-4 py-14 md:py-20">
      <div className="premium-aurora opacity-70" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl">
        <motion.div
          className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.35 }}
        >
          <div>
            <div className="home-glass-panel mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-sky-300">
              <Radio size={16} aria-hidden="true" />
              Live industry radar
            </div>
            <h2 className="text-3xl font-black tracking-tight md:text-5xl">Latest SEO & AI Search Updates</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-base dark:text-slate-300">
              A lightweight RSS-powered briefing for SEO news, Google updates, AI search trends, GEO, ChatGPT, Gemini,
              and crawler changes. Cached in the browser for speed.
            </p>
          </div>
          <div className="home-glass-panel flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            {loading ? "Refreshing feeds" : "Cached live feeds"}
          </div>
        </motion.div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {updateCategories.map((category) => (
            <button
              type="button"
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-black transition ${
                activeCategory === category
                  ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="updates-track">
            {[0, 1, 2].map((item) => (
              <div className="update-skeleton" key={item} />
            ))}
          </div>
        ) : (
          <div className="updates-track">
            {(updates.length > 0 ? updates : fallbackUpdates).map((item, index) => (
              <motion.article
                className="update-card premium-gradient-border p-6"
                key={`${item.source}-${item.title}`}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.32, delay: index * 0.04 }}
                whileHover={{ y: -6 }}
              >
                <div className="relative flex h-full flex-col">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">{item.category}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <CalendarDays size={14} aria-hidden="true" />
                      {formatUpdateDate(item.publishedAt)}
                    </span>
                  </div>
                  <h3 className="text-xl font-black leading-tight text-slate-950 dark:text-white">{item.title}</h3>
                  <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.summary}</p>
                  <div className="mt-auto pt-6">
                    <div className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      <Newspaper size={14} aria-hidden="true" />
                      {item.source}
                    </div>
                    <Link
                      href={item.url}
                      target={item.url.startsWith("http") ? "_blank" : undefined}
                      rel={item.url.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white text-decoration-none shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-blue-700 dark:bg-white dark:text-slate-950"
                    >
                      Read more
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

async function fetchFeedUpdates(feed: (typeof updateFeeds)[number]): Promise<IndustryUpdate[]> {
  const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.feed)}`);
  if (!response.ok) return [];
  const data = (await response.json()) as {
    items?: Array<{
      title?: string;
      description?: string;
      pubDate?: string;
      link?: string;
      categories?: string[];
    }>;
  };

  return (data.items ?? []).slice(0, 4).map((item) => ({
    title: stripHtml(item.title ?? "Untitled update"),
    summary: stripHtml(item.description ?? "Read the full update for more details.").slice(0, 180),
    category: inferCategory(item.title ?? "", item.categories ?? [], feed.category),
    publishedAt: item.pubDate ?? new Date().toISOString(),
    source: feed.source,
    url: item.link ?? feed.feed,
  }));
}

function readUpdatesCache(cacheKey: string): IndustryUpdate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { savedAt?: number; updates?: IndustryUpdate[] };
    const maxAgeMs = 1000 * 60 * 45;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > maxAgeMs) return [];
    return parsed.updates ?? [];
  } catch {
    return [];
  }
}

function inferCategory(title: string, categories: string[], fallback: IndustryUpdate["category"]): IndustryUpdate["category"] {
  const source = `${title} ${categories.join(" ")}`.toLowerCase();
  if (/\b(chatgpt|openai|gpt)\b/.test(source)) return "ChatGPT";
  if (/\b(gemini|bard)\b/.test(source)) return "Gemini";
  if (/\b(ai overview|ai search|answer engine|generative)\b/.test(source)) return "AI Search";
  if (/\b(geo|generative engine)\b/.test(source)) return "GEO";
  if (/\b(technical|crawl|robots|schema|structured data|indexing)\b/.test(source)) return "Technical SEO";
  if (/\b(google|core update|ranking)\b/.test(source)) return "Google Update";
  return fallback;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatUpdateDate(value: string): string {
  if (value === "Cached source") return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}
