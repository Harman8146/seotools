"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Bot, Home, Menu, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/seo", label: "Local Ranking Tool", icon: Search },
  { href: "/ai-visibility-checker", label: "GEO Analyzer", icon: Bot },
];

export function SiteNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-white/50 bg-white/80 px-4 py-3 shadow-[0_18px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/75"
        aria-label="Primary navigation"
      >
        <Link href="/" className="group flex items-center gap-3 text-decoration-none" aria-label="SEO GEO Platform home">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25">
            <BarChart3 size={21} aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-black tracking-tight text-slate-950 dark:text-white">SEO GEO</span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              AI Platform
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-decoration-none transition ${
                  active
                    ? "text-blue-700 dark:text-sky-300"
                    : "text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-xl bg-blue-50 shadow-sm dark:bg-sky-400/10"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative inline-flex items-center gap-2">
                  <Icon size={16} aria-hidden="true" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/ai-visibility-checker"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-black text-decoration-none shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-blue-700 dark:bg-white dark:text-slate-950"
          >
            <Sparkles size={16} aria-hidden="true" />
            Run GEO Audit
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label="Toggle navigation menu"
        >
          {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="mx-auto mt-2 max-w-6xl rounded-2xl border border-white/50 bg-white/95 p-2 shadow-2xl backdrop-blur-xl md:hidden dark:border-slate-700 dark:bg-slate-950/95"
          >
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-decoration-none ${
                    active
                      ? "bg-blue-50 text-blue-700 dark:bg-sky-400/10 dark:text-sky-300"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={17} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/ai-visibility-checker"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white text-decoration-none dark:bg-white dark:text-slate-950"
            >
              <Sparkles size={16} aria-hidden="true" />
              Run GEO Audit
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
