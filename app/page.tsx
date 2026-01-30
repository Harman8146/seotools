"use client";
// import "./globals.css";
// import "./layout.tsx";
import { useState, useEffect } from "react";

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
  "Canada": "CA",
  "United States": "US",
  "USA": "US",
  "India": "IN",
  "United Kingdom": "GB",
  "UK": "GB",
  "Australia": "AU",
};


/* =======================
   DEVICE CONFIG
======================= */
const devices: any = {
  desktop: { biw: 1366, bih: 768, uact: "" },
  mobile: { biw: 390, bih: 844, uact: "5" },
  tablet: { biw: 768, bih: 1024, uact: "" },
  iphone: { biw: 375, bih: 812, uact: "5" },
  pixel: { biw: 412, bih: 915, uact: "5" },
};

function detectGlFromLocation(location: string) {
  for (const country in countryToGl) {
    if (location.includes(country)) {
      return countryToGl[country];
    }
  }
  return "US"; // fallback (safe)
}

function buildGoogleUrl(
  keyword: string,
  location: string,
  lang: string,
  domain: string,
  device: string
) {
  // 🔒 FORCE DESKTOP (SAFE)
  const d = devices.desktop;

  // ✅ GL comes from USER LOCATION
  const gl = detectGlFromLocation(location);

  return (
    `https://${domain}/search` +
    `?q=${encodeURIComponent(keyword)}` +
    `&gl=${gl}` +
    `&hl=${lang}` +
    `&adtest=on` +
    `&pws=0` +
    `&uule=${generateUULE(location)}` +
    `&num=10`
  );
}





/* =======================
   PAGE
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
  const [device, setDevice] = useState("desktop");
 

  const GEONAMES_USER = "test02888";

  /* Dark mode */
  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") setDark(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", String(dark));
  }, [dark]);

  /* GeoNames (LOCKED AFTER SELECT) */
  useEffect(() => {
    if (locationSelected) return;
    if (query.length < 2) {
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
useEffect(() => {
  document.body.classList.toggle("dark", dark);
}, [dark]);

  const run = () => {
  if (!keyword || !location) {
    alert("Keyword and location required");
    return;
  }

  const url = buildGoogleUrl(
    keyword,
    location,
    language,
    domain,
    device
  );

  window.open(url, "_blank", "noopener,noreferrer");
};

 return (
  <>
     
  <div
  style={{
    position: "absolute",
    inset: 0,
    zIndex: 0,
    background:
      "radial-gradient(circle at 20% 20%, rgba(37,99,235,0.15), transparent 40%), radial-gradient(circle at 80% 30%, rgba(99,102,241,0.15), transparent 40%)",
  }}
/>

  <main
  className="min-vh-100 d-flex align-items-center justify-content-center"
  style={{
    background: "transparent",
    padding: "60px 20px",
  }}
>
     
    
    <div className="container">
      
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-7">
          <div className={`card shadow-lg border-0 ${dark ? "bg-black text-light" : ""}`}>
            <div
  className="card-body p-4 p-md-5"
  style={{
    background: dark
      ? "rgba(255,255,255,0.02)"
      : "rgba(255,255,255,0.6)",
    backdropFilter: "blur(14px)",
  }}
>




              {/* HEADER */}
             <div
  className="px-4 px-md-5 py-4"
  style={{
    background: dark
      ? "linear-gradient(135deg, #020617, #020617)"
      : "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff",
  }}
>
  <div className="d-flex justify-content-between align-items-center">
    <h1 className="fw-bold mb-0" style={{ fontSize: "1.9rem" }}>
      Google SERP Preview Tool
    </h1>

    <button
      className="btn btn-sm btn-light"
      onClick={() => setDark(!dark)}
      style={{ borderRadius: "20px" }}
    >
      {dark ? "☀ Light" : "🌙 Dark"}
    </button>
  </div>

  <p className="mt-2 mb-0 opacity-75">
    Preview Google search results by keyword, location, language & domain.
  </p>
</div>

<br />
              {/* INTRO */}
              <p className="text-secondary med mb-4">
                This tool lets you preview Google search results for a specific
                <strong> keyword, location, language, and Google domain </strong>
                using Google’s official. It simulates how ads and organic results may appear in different
                cities.
              </p>

              {/* SEARCH QUERY */}
              <div className="mb-3">
                <label className={`form-label fw-semibold ${dark ? "text-info" : "text-primary"}`}>
Search Keyword</label>
                <input
                  className="form-control"
                  placeholder="e.g. seo services near me"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <div className="form-text">
                  Enter the exact keyword you want to preview on Google.
                </div>
              </div>

              {/* LOCATION */}
              <div className="mb-3 position-relative">
                <label className={`form-label fw-semibold ${dark ? "text-info" : "text-primary"}`}>
Target Location</label>
                <input
                  className="form-control"
                  placeholder="Start typing city name..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setLocationSelected(false);
                  }}
                />

                {suggestions.length > 0 && (
                  <div className={`list-group position-absolute w-100 shadow ${dark ? "bg-dark" : ""}`} style={{ zIndex: 10 }}>
                    {suggestions.map((c) => (
                      <button
                        key={c.geonameId}
                        className={`list-group-item list-group-item-action ${dark ? "bg-black text-light" : ""}`}
                        onClick={() => selectCity(c)}
                      >
                        {c.name}, {c.adminName1}, {c.countryName}
                      </button>
                    ))}
                  </div>
                )}

                
              </div>

              {/* DEVICE */}
              <div className="mb-3">
               <label className={`form-label fw-semibold ${dark ? "text-info" : "text-primary"}`}>
Device Type</label>
                <select
                  className="form-select"
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                >
                  <option value="desktop">Desktop (Recommended)</option>
                </select>
                <div className="form-text">
                  Desktop mode ensures stable and accurate ad preview results.
                </div>
              </div>

              {/* DOMAIN */}
              <div className="mb-3">
               <label className={`form-label fw-semibold ${dark ? "text-info" : "text-primary"}`}>
Google Domain</label>
                <select
                  className="form-select"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                >
                  <option value="www.google.com">Google.com (Global)</option>
                  <option value="www.google.co.in">Google.co.in (India)</option>
                  <option value="www.google.ca">Google.ca (Canada)</option>
                  <option value="www.google.co.uk">Google.co.uk (UK)</option>
                </select>
              </div>

              {/* LANGUAGE */}
              <div className="mb-4">
                <label className={`form-label fw-semibold ${dark ? "text-info" : "text-primary"}`}>
Language</label>
                <select
                  className="form-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="fr">French</option>
                </select>
              </div>

              {/* CTA */}
              <button
                className="btn w-100 fw-bold py-3"
style={{
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  borderRadius: "14px",
  color: "#fff",
  fontSize: "1.05rem",
}}

                onClick={run}
              >
                🔍 Preview Google SERP
              </button>

              {/* FOOTER INFO */}
              <div className="mt-4 text-center small">
  <div className="d-flex justify-content-center gap-3 flex-wrap">
    <span className="badge bg-success bg-opacity-10 text-success px-3 py-2">
      ✔ Official Google UULE
    </span>
    <span className="badge bg-info bg-opacity-10 text-info px-3 py-2">
      ✔ No VPN / Proxy
    </span>
    <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2">
      ✔ Best for Local SEO
    </span>
  </div>
</div>
            </div>
          </div>
        </div>
      </div>
                <br />
                <br />

       {/* INTERACTIVE CONTENT SECTION */}
<section
  className="p-5 rounded-4 mt-5 position-relative overflow-hidden"
  style={{
    background: "linear-gradient(135deg, #eef2ff, #f8f9fa)",
    transition: "all 0.3s ease",
  }}
>
  {/* floating background effect */}
  <div
    style={{
      position: "absolute",
      top: "-40px",
      right: "-40px",
      width: "200px",
      height: "200px",
      background: "radial-gradient(circle, rgba(13,110,253,0.15), transparent)",
      borderRadius: "50%",
    }}
  />

  <h2 className="fw-bold text-primary mb-4 display-6">
    Why Use a Google SERP Preview Tool?
  </h2>

  <p className="fs-5 text-dark lh-lg">
    A <strong className="text-primary">Google SERP preview tool</strong> allows
    website owners, SEO professionals, bloggers, and digital marketers to
    visualize how their pages will appear in{" "}
    <strong>Google search results</strong> before publishing. This ensures your
    title and meta description are readable, optimized, and designed to attract
    clicks.
  </p>

  <p className="fs-5 text-dark lh-lg">
    Google may automatically truncate titles and descriptions that exceed the
    recommended pixel limits. Using a SERP preview tool helps you avoid this
    problem and craft snippets that communicate value clearly while increasing
    <span className="text-danger fw-semibold"> click-through rates</span>.
  </p>

  <p className="fs-5 text-dark lh-lg">
    Even high-ranking pages can underperform if their metadata is poorly
    written. Optimized snippets improve trust, relevance, and visibility,
    helping you gain more{" "}
    <strong className="text-success">organic traffic</strong> without changing
    your rankings.
  </p>

  <p className="fs-5 text-dark lh-lg">
    By previewing and refining metadata before publishing, you save time,
    reduce guesswork, and improve overall SEO performance. This makes SERP
    preview tools an essential part of any professional SEO workflow.
  </p>

  {/* INTERACTIVE INFO BOX */}
  <div
    className="mt-5 p-4 rounded-3 border-start border-5 border-primary bg-white shadow-sm"
    style={{ transition: "transform 0.3s ease" }}
  >
    <p className="fs-5 mb-0 text-dark">
      💡 <strong>Pro Tip:</strong> Always test multiple title and description
      variations. Small wording changes can significantly improve CTR and user
      engagement.
    </p>
  </div>
</section>

       <section>
          <h2>Frequently Asked Questions</h2>

          <h3>How can I check keyword ranking for free?</h3>
          <p>You can check keyword ranking for free by using our tool without signup.</p>

          <h3>Is this keyword ranking checker accurate?</h3>
          <p>Yes, results are based on real Google search data.</p>

          <h3>Which search engine does this ranking checker use?</h3>
          <p>The tool uses Google search results.</p>

          <h3>Do I need to sign up to use this tool?</h3>
          <p>No signup or login is required.</p>

          <h3>How often should I check keyword rankings?</h3>
          <p>Checking weekly is recommended for SEO tracking.</p>
        </section>
    </div>
    
  </main>
  </>
);

}

/* =======================
   STYLES
======================= */
const page = (d: boolean) => ({
  minHeight: "100vh",
  background: d ? "#0f172a" : "#f4f6f8",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
});

const heading = { fontSize: 28 };

const card = (d: boolean) => ({
  width: "100%",
  maxWidth: 760,
  background: d ? "#020617" : "#fff",
  color: d ? "#e5e7eb" : "#000",
  padding: 30,
  borderRadius: 12,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
});

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const toggle = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #555",
  cursor: "pointer",
};

const sub = (d: boolean) => ({
  color: d ? "#94a3b8" : "#555",
  marginBottom: 16,
});

const label = { fontSize: 16, marginTop: 14 };

const input = (d: boolean) => ({
  width: "100%",
  padding: 12,
  borderRadius: 6,
  border: "1px solid #555",
  background: d ? "#020617" : "#fff",
  color: d ? "#fff" : "#000",
});

const dropdown = (d: boolean) => ({
  position: "absolute" as const,
  width: "100%",
  background: d ? "#020617" : "#fff",
  border: "1px solid #555",
  zIndex: 20,
});

const option = (d: boolean) => ({
  padding: 10,
  cursor: "pointer",
  borderBottom: "1px solid #444",
  background: d ? "#020617" : "#fff",
});

const button = {
  width: "100%",
  marginTop: 20,
  padding: 14,
  background: "#2563eb",
  color: "#fff",
  fontWeight: 700,
  borderRadius: 8,
  cursor: "pointer",
};
