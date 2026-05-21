"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Bot,
  Github,
  Linkedin,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/seo", label: "SEO Tool" },
  { href: "/ai-visibility-checker", label: "AI Visibility Checker" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/about", label: "About" },
];

export function SiteFooter() {
  return (
    <>
      <motion.footer
        className="site-footer"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.35 }}
      >
        <div className="site-footer-grid">
          {/* LEFT */}
          <div>
            <Link
              href="/"
              className="site-footer-brand"
              aria-label="SEO GEO AI Platform home"
            >
              <span className="site-footer-logo">
                <BarChart3 size={24} />
              </span>

              <span>
                <strong>SEO GEO AI Platform</strong>

                
              </span>
            </Link>

            <p className="site-footer-copy">
              Practical tools for local ranking checks, AI visibility audits,
              semantic SEO, crawler accessibility, and technical optimization.
              Built for clear, transparent, rule-based analysis.
            </p>

            <div className="site-footer-trust">
              <span>
                <ShieldCheck size={15} />
                No login required
              </span>

              <span>
                <Sparkles size={15} />
                Rule-based insights
              </span>
            </div>
          </div>

          {/* CENTER */}
          <div>
            <h2>Explore</h2>

            <nav
              className="site-footer-links"
              aria-label="Footer navigation"
            >
              {footerLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* RIGHT */}
          <div>
            <h2>Tools</h2>

            <div className="site-footer-tool-list">
              <Link href="/seo">
                <Search size={16} />
                Local Ranking Tool
              </Link>

              <Link href="/ai-visibility-checker">
                <Bot size={16} />
                AI Visibility Checker
              </Link>

              <Link href="/about">
                <Mail size={16} />
                Contact
              </Link>
            </div>

            <div className="site-footer-social">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <Github size={17} />
              </a>
              <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Linkedin size={17} />
              </a>
              <Link href="/about" aria-label="Contact">
                <Mail size={17} />
              </Link>
            </div>
          </div>
        </div>

        <div className="site-footer-bottom">
          <span>
            © {new Date().getFullYear()} SEO GEO AI Platform. All rights
            reserved.
          </span>

          <span>
            Research-focused SEO tools. Results may vary by search engine,
            location, and crawler access.
          </span>
        </div>
      </motion.footer>

      {/* CSS */}
      <style jsx>{`
        .site-footer {
          position: relative;
          background:
            radial-gradient(circle at 12% 0%, rgba(37, 99, 235, 0.24), transparent 34%),
            radial-gradient(circle at 86% 12%, rgba(14, 165, 233, 0.16), transparent 32%),
            linear-gradient(180deg, rgba(2, 6, 23, 0.96), rgba(8, 13, 28, 0.98));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 34px 34px 0 0;
          padding: 76px 24px 30px;
          color: #d1d5db;
          margin-top: 80px;
          overflow: hidden;
          box-shadow: 0 -30px 90px rgba(15, 23, 42, 0.22);
        }

        .site-footer::before {
          content: "";
          position: absolute;
          left: 24px;
          right: 24px;
          top: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #38bdf8, #6366f1, transparent);
        }

        .site-footer-grid {
          max-width: 1300px;
          margin: auto;
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr;
          gap: 60px;
          align-items: start;
        }

        /* BRAND */

        .site-footer-brand {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 22px;
          color: white;
          text-decoration: none;
        }

        .site-footer-brand strong {
          display: block;
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .site-footer-brand small {
          display: block;
          color: #94a3b8;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .site-footer-logo {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, #2563eb, #06b6d4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.35);
        }

        /* DESCRIPTION */

        .site-footer-copy {
          color: #94a3b8;
          line-height: 1.8;
          font-size: 0.96rem;
          max-width: 540px;
          margin-bottom: 24px;
        }

        /* TRUST BADGES */

        .site-footer-trust {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .site-footer-trust span {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 10px 14px;
          border-radius: 999px;
          font-size: 0.9rem;
          color: #e2e8f0;
          backdrop-filter: blur(12px);
        }

        /* TITLES */

        .site-footer h2 {
          color: white;
          font-size: 1.1rem;
          margin-bottom: 18px;
          font-weight: 700;
        }

        /* LINKS */

        .site-footer-links,
        .site-footer-tool-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .site-footer-links a,
        .site-footer-tool-list a {
          color: #94a3b8;
          text-decoration: none;
          transition: all 0.25s ease;
          font-size: 0.96rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .site-footer-links a:hover,
        .site-footer-tool-list a:hover {
          color: #ffffff;
          transform: translateX(4px);
        }

        .site-footer-social {
          display: flex;
          gap: 10px;
          margin-top: 24px;
        }

        .site-footer-social a {
          display: grid;
          width: 40px;
          height: 40px;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          color: #cbd5e1;
          background: rgba(255, 255, 255, 0.045);
          transition: transform 0.25s ease, color 0.25s ease, border-color 0.25s ease;
        }

        .site-footer-social a:hover {
          color: #ffffff;
          border-color: rgba(56, 189, 248, 0.44);
          transform: translateY(-3px);
        }

        /* BOTTOM */

        .site-footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          margin-top: 50px;
          padding-top: 24px;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          font-size: 0.88rem;
          color: #64748b;
          max-width: 1300px;
          margin-left: auto;
          margin-right: auto;
        }

        /* RESPONSIVE */

        @media (max-width: 992px) {
          .site-footer-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .site-footer {
            padding: 60px 20px 28px;
          }

          .site-footer-bottom {
            flex-direction: column;
            text-align: center;
          }

          .site-footer-brand {
            align-items: center;
          }
        }

        @media (max-width: 576px) {
          .site-footer-brand strong {
            font-size: 1.15rem;
          }

          .site-footer-copy {
            font-size: 0.92rem;
          }

          .site-footer-trust {
            flex-direction: column;
            align-items: flex-start;
          }

          .site-footer-trust span {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
