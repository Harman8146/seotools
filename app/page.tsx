"use client";

import { useState, useEffect } from "react";

/* =======================
   CONFIG & PROXIES
======================= */
const MAX_PAGES = 10;
const PROXY_LIST = [
  "hgmisipg-rotate:awxro353t57e@p.webshare.io:80", // Proxy 1 (for pages 1-5)
  "hgmisipg-rotate:awxro353t57e@p.webshare.io:80", // Proxy 2 (for pages 6-8)
  "hgmisipg-rotate:awxro353t57e@p.webshare.io:80", // Proxy 3 (for pages 9-10)
];

/* =======================
   UULE (STABLE)
======================= */
function generateUULE(location: string) {
  const bytes = new TextEncoder().encode(location);
  const base64 = btoa(String.fromCharCode(...bytes))
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const KEY =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

  return `w+CAIQICI${KEY[bytes.length]}${base64}`;
}

/* =======================
   COUNTRY → GL MAP
======================= */
const countryToGl: Record<string, string> = {
  Canada: "CA",
  "United States": "US",
  USA: "US",
  India: "IN",
  "United Kingdom": "GB",
  UK: "GB",
  Australia: "AU",
};

function detectGlFromLocation(location: string) {
  for (const country in countryToGl) {
    if (location.includes(country)) {
      return countryToGl[country];
    }
  }
  return "US";
}

function buildGoogleUrl(
  keyword: string,
  location: string,
  lang: string,
  domain: string,
  page: number = 1
) {
  const gl = detectGlFromLocation(location).toLowerCase();
  const start = (page - 1) * 10;

  return (
    `https://${domain}/search` +
    `?q=${encodeURIComponent(keyword)}` +
    `&gl=${gl}` +
    `&hl=${lang}` +
    `&adtest=on` +
    `&pws=0` +
    `&num=10` +
    `&start=${start}` +
    `&uule=${generateUULE(location)}`
  );
}

/* =======================
   GLASS CARD STYLE
======================= */
const glassCard = (dark: boolean) => ({
  background: dark
    ? "linear-gradient(180deg, rgba(15,23,42,.9), rgba(2,6,23,.95))"
    : "linear-gradient(180deg, rgba(255,255,255,.75), rgba(255,255,255,.6))",
  backdropFilter: "blur(18px)",
  borderRadius: "22px",
  border: dark
    ? "1px solid rgba(255,255,255,.08)"
    : "1px solid rgba(0,0,0,.06)",
});

/* =======================
   PAGE COMPONENT
======================= */
export default function Home() {
  const [dark, setDark] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [locationSelected, setLocationSelected] = useState(false);
  const [language, setLanguage] = useState("en");
  const [domain, setDomain] = useState("www.google.com");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastRequestTime, setLastRequestTime] = useState(0);

  const GEONAMES_USER = process.env.NEXT_PUBLIC_GEONAMES_USER;

  /* Dark mode */
  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") setDark(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", String(dark));
    document.body.style.background = dark
      ? "radial-gradient(circle at top, #020617, #000)"
      : "radial-gradient(circle at top, #eef2ff, #f8fafc)";
  }, [dark]);

  /* GeoNames suggestions */
  useEffect(() => {
    if (locationSelected || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const t = setTimeout(() => {
      fetch(
        `https://secure.geonames.org/searchJSON?q=${query}&maxRows=6&username=${GEONAMES_USER}`,
        { signal: controller.signal }
      )
        .then((r) => r.json())
        .then((d) => d.geonames && setSuggestions(d.geonames))
        .catch(() => {});
    }, 300);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query, locationSelected]);

  const selectCity = (c: any) => {
    const loc = `${c.name}, ${c.adminName1}, ${c.countryName}`;
    setLocation(loc);
    setQuery(loc);
    setSuggestions([]);
    setLocationSelected(true);
  };

  /* =======================
     RUN WITH PAGE LIMITS & PROXY ROTATION
  ======================= */
 const run = (page: number) => {
  // 1. Check your 10-page limit
  if (page > 10) return alert("Limit: 10 pages.");

  // 2. Check your 15-second human delay
  const now = Date.now();
  if (now - lastRequestTime < 15000) return alert("Please wait 15 seconds.");

  const googleUrl = buildGoogleUrl(keyword, location, language, domain, page);
  
  // Use a relative path so it works on whatever domain Vercel gives you
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(googleUrl)}`;
  
  window.open(proxyUrl, "_blank");
  setLastRequestTime(now);
};

const resetTool = () => {
  setKeyword("");
  setQuery("");
  setLocation("");
  setSuggestions([]);
  setLocationSelected(false);
  setCurrentPage(1);
  setLastRequestTime(0); // This clears the 15-second cooldown immediately
  alert("Tool has been reset. You can start a new search now.");
};

  const faqs = [
    {
      q: "How can I check keyword ranking for free?",
      a: "You can check keyword ranking for free by using our tool without signup.",
    },
    {
      q: "Is this keyword ranking checker accurate?",
      a: "Yes, results are based on real Google search data.",
    },
    {
      q: "Which search engine does this ranking checker use?",
      a: "The tool uses Google search results.",
    },
    {
      q: "Do I need to sign up to use this tool?",
      a: "No signup or login is required.",
    },
    {
      q: "How often should I check keyword rankings?",
      a: "Checking weekly is recommended for SEO tracking.",
    },
  ];

  /* =======================
     RENDER JSX
  ======================= */
  return (
    <>
      {/* Notice */}
      <div
        className="mt-4 px-4 py-3 rounded-4 d-flex align-items-start gap-3"
        style={{
          background: dark
            ? "linear-gradient(135deg, rgba(30,41,59,.6), rgba(15,23,42,.8))"
            : "linear-gradient(135deg, #eef2ff, #f8fafc)",
          border: dark
            ? "1px solid rgba(255,255,255,.08)"
            : "1px solid rgba(99,102,241,.15)",
          color: dark ? "#cbd5f5" : "#334155",
          backdropFilter: "blur(14px)",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #2563eb)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          ℹ️
        </div>

        

      <div>
        <div className="fw-semibold mb-1">Preview Notice</div>
        <div className="small" style={{ lineHeight: 1.6 }}>
          This tool opens real Google search result pages. Google may temporarily
          limit previews after multiple searches. If a limit is reached, please wait
          a few seconds or reset the tool and try again.
        </div>
      </div>
    </div>

    <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
      <strong>SERP Preview Simulation</strong>
      <p className="mt-1">
        This tool simulates how your page may appear in Google search results.
        Actual results may vary based on location, device, and Google algorithms.
      </p>
    </div>


    {/* BACKGROUND */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        background:
          "radial-gradient(circle at 20% 20%, rgba(37,99,235,0.18), transparent 40%), radial-gradient(circle at 80% 30%, rgba(99,102,241,0.18), transparent 40%)",
      }}
    />

    <main className="min-vh-100 d-flex align-items-center justify-content-center px-3">
      <div className="container" style={{ maxWidth: 820 }}>
        <div className="shadow-xl p-4 p-md-5" style={glassCard(dark)}>

          {/* HEADER */}
<div className="px-4 py-4 mb-4" style={{ 
  background: dark ? "#020617" : "linear-gradient(135deg, #2563eb, #4f46e5)", 
  borderRadius: "18px", 
  color: "#fff" 
}}>
  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
    <h1 className="fw-bold mb-0" style={{ fontSize: "1.8rem" }}>
      SERP Preview
    </h1>

    <div className="d-flex gap-2">
      <button 
        className="btn btn-outline-light btn-sm rounded-pill px-3" 
        onClick={resetTool}
      >
        🔄 Reset
      </button>
      
      <button 
        className="btn btn-light btn-sm rounded-pill px-3" 
        onClick={() => setDark(!dark)}
      >
        {dark ? "☀ Light" : "🌙 Dark"}
      </button>
    </div>
  </div>
</div>
          {/* HEADER
          <div
            className="px-4 py-4 mb-4"
            style={{
              background: dark
                ? "linear-gradient(135deg, #020617, #020617)"
                : "linear-gradient(135deg, #2563eb, #4f46e5)",
              borderRadius: "18px",
              color: "#fff",
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <h1 className="fw-bold mb-0" style={{ fontSize: "2.1rem" }}>
                Google SERP Preview Tool
              </h1>

              <button
                className="btn btn-light btn-sm rounded-pill"
                onClick={() => setDark(!dark)}
              >
                {dark ? "☀ Light" : "🌙 Dark"}
              </button>
            </div>

            <p className="mt-2 opacity-75">
              Preview Google search results by keyword, location, language &
              domain.
            </p>
          </div> */}

          {/* INPUTS */}
          <div className="mb-3">
            <label className="fw-semibold text-secondary mb-1">
              Search Keyword
            </label>
            <input
              className="form-control shadow-sm"
              style={{ borderRadius: 12, padding: "14px 16px" }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="mb-3 position-relative">
            <label className="fw-semibold text-secondary mb-1">
              Target Location
            </label>
            <input
              className="form-control shadow-sm"
              style={{ borderRadius: 12, padding: "14px 16px" }}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLocationSelected(false);
              }}
            />

            {suggestions.length > 0 && (
              <div
                className="list-group position-absolute w-100 shadow-lg"
                style={{
                  zIndex: 20,
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {suggestions.map((c) => (
                  <button
                    key={c.geonameId}
                    className="list-group-item list-group-item-action"
                    onClick={() => selectCity(c)}
                  >
                    {c.name}
                    {c.adminName1 ? `, ${c.adminName1}` : ""}
                    {c.countryName ? `, ${c.countryName}` : ""}
                  </button>
                ))}

              </div>
            )}
          </div>

          {/* DOMAIN & LANGUAGE */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="fw-semibold text-secondary mb-1">
                Google Domain
              </label>
              <select
                className="form-select shadow-sm"
                style={{ borderRadius: 12, padding: "12px 14px" }}
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              >
                <option value="www.google.com">Google.com</option>
                <option value="www.google.co.uk">Google.co.uk</option>
                <option value="www.google.ca">Google.ca</option>
                <option value="www.google.co.in">Google.co.in</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="fw-semibold text-secondary mb-1">
                Language
              </label>
              <select
                className="form-select shadow-sm"
                style={{ borderRadius: 12, padding: "12px 14px" }}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="fr">French</option>
              </select>
            </div>
          </div>

          {/* CTA */}
          <button
            className="btn w-100 fw-bold py-3"
            style={{
              background: "linear-gradient(135deg, #2563eb, #4f46e5)",
              borderRadius: 18,
              color: "#fff",
              fontSize: "1.1rem",
              boxShadow: "0 20px 40px rgba(37,99,235,.35)",
            }}
            onClick={() => run(currentPage)}
          >
            🔍 Preview Google SERP
          </button>



          {/* TRUST */}
          <div className="mt-4 d-flex justify-content-center gap-3 flex-wrap">
            {["Official Google", "No VPN / Proxy", "Best for Local SEO"].map(
              (t) => (
                <span
                  key={t}
                  className="badge bg-primary bg-opacity-10 text-primary"
                  style={{
                    padding: "10px 16px",
                    borderRadius: 999,
                    fontWeight: 500,
                  }}
                >
                  ✔ {t}
                </span>
              )
            )}
          </div>
        </div>


        <section
          className="mt-5 position-relative overflow-hidden"
          style={{
            borderRadius: "28px",
            background:
              "linear-gradient(135deg, rgba(238,242,255,.9), rgba(248,250,252,.95))",
            padding: "64px 56px",
            boxShadow:
              "0 40px 80px rgba(15,23,42,.12), inset 0 1px 0 rgba(255,255,255,.6)",
          }}
        >
          {/* soft ambient glow */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 15% 20%, rgba(37,99,235,.18), transparent 40%), radial-gradient(circle at 85% 30%, rgba(79,70,229,.15), transparent 45%)",
              pointerEvents: "none",
            }}
          />

          {/* floating accent */}
          <div
            style={{
              position: "absolute",
              top: "-60px",
              right: "-60px",
              width: "260px",
              height: "260px",
              background:
                "radial-gradient(circle, rgba(99,102,241,.25), transparent 65%)",
              borderRadius: "50%",
            }}
          />

          <div className="position-relative">
            {/* heading */}
            <span
              className="badge mb-3"
              style={{
                background: "rgba(37,99,235,.1)",
                color: "#2563eb",
                padding: "10px 18px",
                borderRadius: "999px",
                fontSize: ".85rem",
                letterSpacing: ".4px",
              }}
            >
              SERP OPTIMIZATION
            </span>

            <h2
              className="fw-bold mb-4"
              style={{
                fontSize: "2.4rem",
                lineHeight: 1.2,
                color: "#0f172a",
              }}
            >
              Why Use a Google SERP Preview Tool?
            </h2>

            {/* content */}
            <div className="fs-5 text-dark lh-lg" style={{ maxWidth: 880 }}>
              <p>
                A <strong className="text-primary">Google SERP preview tool</strong>{" "}
                allows website owners, SEO professionals, bloggers, and digital
                marketers to visualize how their pages will appear in{" "}
                <strong>Google search results</strong> before publishing. This ensures
                your title and meta description are readable, optimized, and designed
                to attract clicks.
              </p>

              <p>
                Google may automatically truncate titles and descriptions that exceed
                the recommended pixel limits. Using a SERP preview tool helps you
                avoid this problem and craft snippets that communicate value clearly
                while increasing{" "}
                <span className="text-danger fw-semibold">
                  click-through rates
                </span>
                .
              </p>

              <p>
                Even high-ranking pages can underperform if their metadata is poorly
                written. Optimized snippets improve trust, relevance, and visibility,
                helping you gain more{" "}
                <strong className="text-success">organic traffic</strong> without
                changing your rankings.
              </p>

              <p>
                By previewing and refining metadata before publishing, you save time,
                reduce guesswork, and improve overall SEO performance. This makes SERP
                preview tools an essential part of any professional SEO workflow.
              </p>
            </div>

            {/* pro tip card */}
            <div
              className="mt-5 p-4 d-flex align-items-start gap-3"
              style={{
                background: "rgba(255,255,255,.85)",
                backdropFilter: "blur(10px)",
                borderRadius: "18px",
                border: "1px solid rgba(37,99,235,.15)",
                boxShadow: "0 20px 40px rgba(37,99,235,.15)",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "1.2rem",
                  flexShrink: 0,
                }}
              >
                💡
              </div>

              <p className="fs-5 mb-0 text-dark">
                <strong>Pro Tip:</strong> Always test multiple title and description
                variations. Small wording changes can significantly improve CTR and
                user engagement.
              </p>
            </div>
          </div>
        </section>


        {/* FAQ */}
        <section className="mt-5">
          <h2 className="fw-bold text-center mb-4">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((f, i) => (
              <details
                key={i}
                className="bg-white border rounded-4 p-4 shadow-sm mb-3"
              >
                <summary className="fw-semibold fs-5 cursor-pointer">
                  {f.q}
                </summary>
                <p className="mt-3 text-secondary fs-5">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  </>
);
}
