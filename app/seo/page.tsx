"use client";

import { motion } from "framer-motion";
import {
  Bot,
  CheckCircle2,
  ExternalLink,
  Globe2,
  MapPin,
  Moon,
  Navigation,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteNavbar } from "@/components/site-navbar";
// import { getUULE, uuleArray, getGL } from "../src/lib/uule";
import { getUULE, getGL, uuleArray } from "@/src/lib/uule";


export default function Home() {
  const [dark, setDark] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("en");
  const [domain, setDomain] = useState("www.google.com");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [locationSelected, setLocationSelected] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{
    city: string;
    countryCode: string;
    state: string;
  } | null>(null);

  useEffect(() => {
    document.body.style.background = dark
      ? "#020617"
      : "#f8fafc";
  }, [dark]);

/* =======================
    LOCAL SUGGESTIONS
======================= */
useEffect(() => {
  // If the user hasn't typed enough or already selected a city, clear suggestions
  if (locationSelected || query.length < 2) {
    setSuggestions([]);
    return;
  }

  // Filter your local uule.json array based on the user's input
  const results = uuleArray
    .filter((item) => 
      item.city.toLowerCase().startsWith(query.toLowerCase()) ||
      (item.state && item.state.toLowerCase().startsWith(query.toLowerCase()))
    )
    // .slice(0, 5); // Limit to top 5 matches for UI clarity

  setSuggestions(results);
}, [query, locationSelected]);

  const selectCity = (item: any) => {
  setPickedLocation({
    city: item.city,
    countryCode: item.countryCode,
    state: item.state || ""
  });

  // Display the City and State from your JSON in the input field
  setQuery(`${item.city}${item.state ? `, ${item.state}` : ""}, ${item.countryCode}`);
  setSuggestions([]);
  setLocationSelected(true);
};

  const run = (pageNumber: number = 1) => {
    if (!keyword || !pickedLocation) {
      alert("Please enter a keyword and select a location.");
      return;
    }
    const uule = getUULE(pickedLocation.city, pickedLocation.countryCode, pickedLocation.state);
    const gl = getGL(pickedLocation.countryCode);
    const startIndex = (pageNumber - 1) * 10;
    
    const googleUrl = `https://${domain}/search?q=${encodeURIComponent(keyword)}&gl=${gl}&hl=${language}&adtest=on&pws=0&uule=${uule}&num=10${pageNumber > 1 ? `&start=${startIndex}` : ""}`;
    window.open(googleUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
   <SiteNavbar />
    <main
      className={`seo-premium-page position-relative overflow-hidden ${dark ? "seo-premium-dark text-light" : "text-dark"}`}
    >
      <div className="seo-orb seo-orb-one" aria-hidden="true" />
      <div className="seo-orb seo-orb-two" aria-hidden="true" />
      <div className="seo-grid-bg" aria-hidden="true" />

      {/* TOP HEADER DISCLAIMER - FULL WIDTH */}
      <motion.div
        className={`mx-auto mt-4 mb-4 px-3 ${dark ? "text-light" : "text-dark"}`}
        style={{ maxWidth: "1040px" }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div
          className={`rounded-4 px-4 py-3 text-center shadow-sm border ${
            dark ? "bg-danger bg-opacity-10 border-danger border-opacity-25" : "bg-warning bg-opacity-10 border-warning border-opacity-25"
          }`}
          style={{ backdropFilter: "blur(16px)", fontSize: "0.9rem" }}
        >
          <span className="fw-bold text-warning">⚠️ Pro-Tip:</span>

          {" "}For best results, use a{" "}
          <strong>Private or Incognito Window</strong> and avoid rapid repeated
          searches. If Google shows a <strong>403 Error</strong>, simply close the
          tab and reopen the search.
        </div>
      </motion.div>

      <div className="container position-relative pb-5" style={{ maxWidth: "1040px", zIndex: 1 }}>
        {/* HEADER SECTION (SEO H1) */}
        <motion.header
          className="seo-hero-shell text-center text-lg-start mb-5"
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div className="row g-4 align-items-center">
            <div className="col-lg-8">
              <div className="d-inline-flex align-items-center gap-2 rounded-pill border px-3 py-2 mb-4 small fw-bold text-primary bg-white bg-opacity-75 shadow-sm">
                <Search size={16} aria-hidden="true" />
                Local SEO SERP Intelligence
                <span className="badge rounded-pill text-bg-primary">SEO</span>
              </div>
              <h1 className="display-4 fw-black mb-3 seo-gradient-title">Google Local SERP Checker Tool</h1>
              <p className="lead opacity-75 mb-0">
                Simulate Google search results from any city in the world.
              </p>
            </div>
            <div className="col-lg-4 text-center text-lg-end">
              <motion.button
                className={`btn rounded-pill fw-bold px-4 py-3 d-inline-flex align-items-center gap-2 ${
                  dark ? "btn-light" : "btn-outline-primary"
                }`}
                onClick={() => setDark(!dark)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
                Switch to {dark ? "Light" : "Dark"} Mode
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* TOOL SECTION */}
        <motion.div
          className={`seo-tool-card card border-0 mb-5 ${dark ? "text-white" : "text-dark"}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, delay: 0.08 }}
          whileHover={{ y: -3 }}
        >
          <div className="card-body p-4 p-md-5">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="seo-icon-tile">
                <Sparkles size={22} aria-hidden="true" />
              </div>
              <div>
                <h2 className="h4 fw-black mb-1">Preview localized SERPs</h2>
                <p className="small opacity-75 mb-0">Enter a query, choose a city, and open a clean localized Google result.</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold small d-flex align-items-center gap-2">
                <Search size={15} aria-hidden="true" />
                SEARCH QUERY
              </label>
              <input className="form-control form-control-lg seo-input" placeholder="Enter keyword (e.g. Flower Delivery)" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>

            <div className="mb-4 position-relative">
              <label className="form-label fw-bold small d-flex align-items-center gap-2">
                <MapPin size={15} aria-hidden="true" />
                GEO-LOCATION (CITY, STATE)
              </label>
              <input className="form-control form-control-lg seo-input" placeholder="Start typing a city..." value={query} onChange={(e) => { setQuery(e.target.value); setLocationSelected(false); }} />
            {suggestions.length > 0 && (
  <motion.div
    className="list-group position-absolute w-100 shadow-lg mt-2 z-3 seo-suggestion-menu"
    style={{ 
      maxHeight: "250px", // Limits height to about 4-5 items
      overflowY: "auto",  // Enables vertical scrolling
    }}
    initial={{ opacity: 0, y: 8, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.18 }}
  >
    {suggestions.map((s) => (
      <button 
        key={s.uule} // Unique key fix
        className="list-group-item list-group-item-action py-3 d-flex justify-content-between align-items-center seo-suggestion-item"
        onClick={() => selectCity(s)}
      >
        <div className="d-flex align-items-center gap-3">
          <span className="seo-mini-pin"><MapPin size={15} aria-hidden="true" /></span>
          <span>
          <strong className="d-block">{s.city}</strong>
          <span className="small opacity-75">{s.state}, {s.countryCode}</span>
          </span>
        </div>
        <span className="badge rounded-pill text-bg-primary bg-opacity-75 small">Local</span>
      </button>
    ))}
  </motion.div>
)}

            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-bold small d-flex align-items-center gap-2">
                  <Globe2 size={15} aria-hidden="true" />
                  GOOGLE DOMAIN
                </label>
                <select className="form-select seo-input" value={domain} onChange={(e) => setDomain(e.target.value)}>
                  <option value="www.google.com">Google.com</option>
                  <option value="www.google.co.uk">Google.co.uk (United Kingdom)</option>
                  <option value="www.google.ca">Google.ca (Canada)</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small d-flex align-items-center gap-2">
                  <Bot size={15} aria-hidden="true" />
                  LANGUAGE
                </label>
                <select className="form-select seo-input" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>

            <div className="d-grid gap-2">
              <motion.button
                className="btn btn-primary btn-lg fw-black py-3 seo-primary-cta d-inline-flex align-items-center justify-content-center gap-2"
                onClick={() => run(1)}
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <Search size={20} aria-hidden="true" />
                Preview SERP Page
                <ExternalLink size={18} aria-hidden="true" />
              </motion.button>
              <div className="d-flex gap-2">
              
              </div>
            </div>
            
          </div>
        </motion.div>

      {/* --- SEO EDUCATIONAL CONTENT --- */}
        <motion.section
          className="mt-5 seo-content-card"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4 }}
        >
          <div className="row g-5">
            <div className="col-md-6">
              <div className="seo-icon-tile mb-3"><Navigation size={22} aria-hidden="true" /></div>
              <h2 className="h4 fw-black mb-3">How does local search simulation work?</h2>
              <p className=" text-lg">
                Our tool utilizes specialized search parameters to inform search engines of a specific 
                geographic intent. Unlike standard searches that rely on your IP address, 
                this method forces the search engine to display results based on the coordinates 
                of your chosen city.
              </p>
            </div>
            <div className="col-md-6">
              <div className="seo-icon-tile mb-3"><ShieldCheck size={22} aria-hidden="true" /></div>
              <h2 className="h4 fw-black mb-3">Benefits for SEO Professionals</h2>
              <ul className=" ps-3">
                <li className="mb-2 text-lg"><strong>Unbiased Data:</strong> Remove the influence of your personal search history.</li>
                <li className="mb-2 text-lg"><strong>Ad Verification:</strong> Check if localized PPC ads are triggering correctly.</li>
                <li><strong>GMB Monitoring:</strong> Track local map pack rankings for remote clients.</li>
              </ul>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="mb-10 seo-copy-panel"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.36 }}
        >
        <p className="mb-6 text-lg">
          If you need to check Google search results from a different city or country, you’re in the right place. 
          We built this <strong>Google Search Simulator</strong> to provide SEO professionals and business owners 
          with a lightweight, "no-friction" way to see exactly what local customers are seeing in real-time.
        </p>
      </motion.section>

      {/* Why We Built This Section */}
      <section className="grid md:grid-cols-2 gap-8 mb-12">
        <motion.div
          className="p-6 seo-content-card h-100"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
        >
          <h2 className="text-2xl font-black mb-4 text-blue-700 dark:text-blue-400">Why Use This Tool?</h2>
          <ul className="space-y-3 list-none p-0 text-lg">
            <li className="flex items-start">
              <CheckCircle2 className="text-blue-500 mr-2 mt-1 flex-shrink-0" size={20} aria-hidden="true" />
              <span><strong>Zero Latency:</strong> Instant results using an internal database of 100k+ locations.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="text-blue-500 mr-2 mt-1 flex-shrink-0" size={20} aria-hidden="true" />
              <span><strong>Privacy First:</strong> We generate clean URLs without tracking your history.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="text-blue-500 mr-2 mt-1 flex-shrink-0" size={20} aria-hidden="true" />
              <span><strong>No Logins:</strong> Direct access to local SEO data without the friction of 2026 platforms.</span>
            </li>
          </ul>
        </motion.div>

        <motion.div
          className="p-6 seo-content-card h-100"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          transition={{ delay: 0.05 }}
        >
          <h2 className="text-2xl font-black mb-4">How it Works</h2>
          <ol className="list-decimal list-inside space-y-2 text-lg">
            <li>Enter your <strong>Keyword</strong>.</li>
            <li>Select your <strong>Target City</strong>.</li>
            <li>Click <strong>Preview</strong> for a localized result.</li>
          </ol>
        </motion.div>
      </section>

      {/* Comparison/Value Section */}
      <motion.section
        className="mb-12 seo-copy-panel"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
       
        <p className="text-lg">
          Our tool leverages Google’s REST-style search URLs directly. By automating the math behind location 
          identifiers, we allow you to bypass IP-based tracking almost as if the query were coming from the 
          selected city itself.
        </p>
      </motion.section>

      {/* Pro-Tip Box */}
      <motion.div
        className="seo-tip-card mb-12"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h3 className="text-lg font-black text-yellow-800 dark:text-yellow-200 mb-2 d-flex align-items-center gap-2">
          <Sparkles size={20} aria-hidden="true" />
          Pro SEO Tip
        </h3>
        <p className="text-lg">
          For the most accurate audits, use our <strong>"Copy URL"</strong> feature and paste the link into an 
          <strong> Incognito Window</strong>. This ensures your own search history doesn't interfere with the 
          simulated local results.
        </p>
      </motion.div>

      <footer className="seo-footer mt-5">
  <div className="row g-4 align-items-center">
    <div className="col-md-6 text-center text-md-start">
      <p className="small opacity-75 mb-0">
        &copy; {new Date().getFullYear()} Local Search Simulator. All rights reserved.
      </p>
    </div>
    <div className="col-md-6 text-center text-md-end">
      <nav className="d-flex flex-wrap justify-content-center justify-content-md-end gap-3 small" aria-label="Footer navigation">
        {/* <Link
          href="/ai-visibility-checker"
          className="text-decoration-none fw-bold text-primary d-inline-flex align-items-center gap-1 geo-nav-link"
          title="Open GEO Analyzer"
          aria-label="Open GEO Analyzer, new AI tool"
        >
          <Bot size={15} aria-hidden="true" />
          GEO Analyzer
          <span className="badge rounded-pill text-bg-primary ms-1">AI</span>
        </Link> */}
        <a href="/privacy" className="text-decoration-none opacity-75 hover-opacity-100 geo-nav-link">Privacy Policy</a>
        <a href="/terms" className="text-decoration-none opacity-75 hover-opacity-100 geo-nav-link">Terms & Conditions</a>
        <a href="/about" className="text-decoration-none opacity-75 hover-opacity-100 geo-nav-link">About</a>
        
      </nav>
    </div>
  </div>
  
  <div className="row mt-4">
    <div className="col-12 text-center small opacity-50">
      <p style={{ fontSize: '0.75rem' }}>
        <strong>SEO Note:</strong> This tool is 
    designed for research purposes. It simulates localized search environments to help 
    professionals analyze international and regional search intent accurately.
      </p>
    </div>
  </div>
</footer>
      </div>
    </main>
    </>
  );
}
