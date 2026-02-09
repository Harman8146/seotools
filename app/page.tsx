"use client";

import { useEffect, useState } from "react";
import { getUULE, uuleArray, getGL } from "../src/lib/uule";
let GLOBAL_UULE_DATA: any[] = [];

export default function Home() {
  // 1. Define your states (Make sure the names match!)
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

// We will use "isDataLoaded" to stay consistent with the logic below
const [uuleData, setUuleData] = useState<any[]>([]);
const [isDataLoaded, setIsDataLoaded] = useState(false); 

// 2. LOAD DATA (Runs once when the page opens)
useEffect(() => {
  const loadData = async () => {
    // Check if the global variable already has data
    if (GLOBAL_UULE_DATA.length > 0) {
      setIsDataLoaded(true);
      return;
    }
    try {
      // Import the file. Make sure the path "../src/lib/uule" is correct!
      const { uuleArray } = await import("../src/lib/uule");
      GLOBAL_UULE_DATA = uuleArray;
      setIsDataLoaded(true); // Now this matches the state above
    } catch (e) {
      console.error("Data failed to load", e);
    }
  };
  loadData();
}, []);


  

  useEffect(() => {
    document.body.style.background = dark
      ? "#020617"
      : "#f8fafc";
  }, [dark]);

/* =======================
    LOCAL SUGGESTIONS (FIXED)
======================= */
useEffect(() => {
    if (locationSelected || query.length < 2 || !isDataLoaded) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      // Split query by commas or spaces to handle "Milton, ON"
      const searchTerms = query.toLowerCase().split(/[,\s]+/).filter(Boolean);

      const results = GLOBAL_UULE_DATA.filter((item) => {
        const city = item.city.toLowerCase();
        const state = (item.state || "").toLowerCase();
        
        // Every part of your search (e.g. "milton" AND "on") must match
        return searchTerms.every(term => 
          city.includes(term) || state.includes(term)
        );
      });

      // Show only top 15 results to keep the UI snappy
      setSuggestions(results.slice(0, 15));
    }, 200); // 200ms debounce

    return () => clearTimeout(timer);
    
    // FIX: The dependency array size is now always 3.
  }, [query, locationSelected, isDataLoaded]);

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
    {/* TOP HEADER DISCLAIMER - FULL WIDTH */}
{/* <div className="w-100 py-2 px-3 text-center mb-4" 
     style={{ 
       background: dark ? "#450a0a" : "#fee2e2", 
       borderBottom: `1px solid ${dark ? "#991b1b" : "#fecaca"}`,
       fontSize: "0.85rem" 
     }}>
  <span className="fw-bold text-danger">⚠️ Pro-Tip:</span> 
  {" "}If you see a <strong>403 Error</strong>, please close the tab and reopen it. 
  For best results, use a <strong>Private or Incognito tab</strong> to ensure non-personalized results.
</div> */}

    <main className={`container-fluid py-5 ${dark ? "text-light" : "text-dark"}`}>

      <div className="container" style={{ maxWidth: "800px" }}>

        
        
        {/* HEADER SECTION (SEO H1) */}
        <header className="text-center mb-5">
          <h1 className="display-5 fw-bold mb-3">Google Local SERP Checker Tool</h1>
          <p className="lead opacity-75">
            Simulate Google search results from any city in the world.
          </p>
          <button className="btn btn-sm btn-outline-primary" onClick={() => setDark(!dark)}>
            Switch to {dark ? "Light" : "Dark"} Mode
          </button>
        </header>

        {/* TOOL SECTION */}
        <div className={`card shadow-sm border-0 mb-5 ${dark ? "bg-slate-900 text-white" : "bg-white"}`} 
             style={{ borderRadius: "20px", background: dark ? "#0f172a" : "#ffffff" }}>
          <div className="card-body p-4 p-md-5">
            <div className="mb-4">
              <label className="form-label fw-bold small">SEARCH QUERY</label>
              <input className="form-control form-control-lg" placeholder="Enter keyword (e.g. Flower Delivery)" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>

            <div className="mb-4 position-relative">
              <label className="form-label fw-bold small">GEO-LOCATION (CITY, STATE)</label>
              <input className="form-control form-control-lg" placeholder="Start typing a city..." value={query} onChange={(e) => { setQuery(e.target.value); setLocationSelected(false); }} />
            {suggestions.length > 0 && (
  <div 
    className="list-group position-absolute w-100 shadow-lg mt-1 z-3"
    style={{ 
      maxHeight: "250px", // Limits height to about 4-5 items
      overflowY: "auto",  // Enables vertical scrolling
      borderRadius: "12px",
      border: "1px solid rgba(0,0,0,0.1)"
    }}
  >
    {suggestions.map((s) => (
      <button 
        key={s.uule} // Unique key fix
        className="list-group-item list-group-item-action py-3 d-flex justify-content-between align-items-center" 
        onClick={() => selectCity(s)}
      >
        <div>
          <strong className="d-block">{s.city}</strong>
          <span className="small opacity-75">{s.state}, {s.countryCode}</span>
        </div>
        <span className="badge rounded-pill bg-light text-dark border small">Local</span>
      </button>
    ))}
  </div>
)}

            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-bold small">GOOGLE DOMAIN</label>
                <select className="form-select" value={domain} onChange={(e) => setDomain(e.target.value)}>
                  <option value="www.google.com">Google.com</option>
                  <option value="www.google.co.uk">Google.co.uk (United Kingdom)</option>
                  <option value="www.google.ca">Google.ca (Canada)</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small">LANGUAGE</label>
                <select className="form-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>

            <div className="d-grid gap-2">
              <button className="btn btn-primary btn-lg fw-bold py-3" onClick={() => run(1)}>🔍 Preview SERP Page </button>
              <div className="d-flex gap-2">
              
              </div>
            </div>
            
          </div>
        </div>

      {/* --- SEO EDUCATIONAL CONTENT --- */}
        <section className="mt-5 border-top pt-5">
          <div className="row g-5">
            <div className="col-md-6">
              <h2 className="h4 fw-bold mb-3">How does local search simulation work?</h2>
              <p className=" text-lg">
                Our tool utilizes specialized search parameters to inform search engines of a specific 
                geographic intent. Unlike standard searches that rely on your IP address, 
                this method forces the search engine to display results based on the coordinates 
                of your chosen city.
              </p>
            </div>
            <div className="col-md-6">
              <h2 className="h4 fw-bold mb-3">Benefits for SEO Professionals</h2>
              <ul className=" ps-3">
                <li className="mb-2 text-lg"><strong>Unbiased Data:</strong> Remove the influence of your personal search history.</li>
                <li className="mb-2 text-lg"><strong>Ad Verification:</strong> Check if localized PPC ads are triggering correctly.</li>
                <li><strong>GMB Monitoring:</strong> Track local map pack rankings for remote clients.</li>
              </ul>
            </div>
          </div>
        </section>


 <section className="mb-10">
        <p className="mb-6 text-lg">
          If you need to check Google search results from a different city or country, you’re in the right place. 
          We built this <strong>Google Search Simulator</strong> to provide SEO professionals and business owners 
          with a lightweight, "no-friction" way to see exactly what local customers are seeing in real-time.
        </p>
      </section>

      {/* Why We Built This Section */}
      <section className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="p-6 bg-white-50 white:bg-slate-800 rounded-2xl shadow-sm border border-blue-100 white:border-slate-700">
          <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-400">Why Use This Tool?</h2>
          <ul className="space-y-3 list-none p-0 text-lg">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              <span><strong>Zero Latency:</strong> Instant results using an internal database of 100k+ locations.</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              <span><strong>Privacy First:</strong> We generate clean URLs without tracking your history.</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              <span><strong>No Logins:</strong> Direct access to local SEO data without the friction of 2026 platforms.</span>
            </li>
          </ul>
        </div>

        <div className="p-6 bg-white-50 white:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold mb-4">How it Works</h2>
          <ol className="list-decimal list-inside space-y-2 text-lg">
            <li>Enter your <strong>Keyword</strong>.</li>
            <li>Select your <strong>Target City</strong>.</li>
            <li>Click <strong>Preview</strong> for a localized result.</li>
          </ol>
        </div>
      </section>

      {/* Comparison/Value Section */}
      <section className="mb-12">
       
        <p className="text-lg">
          Our tool leverages Google’s REST-style search URLs directly. By automating the math behind location 
          identifiers, we allow you to bypass IP-based tracking almost as if the query were coming from the 
          selected city itself.
        </p>
      </section>

      {/* Pro-Tip Box */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-6 rounded-r-lg mb-12">
        <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-2">Pro SEO Tip</h3>
        <p className="text-lg">
          For the most accurate audits, use our <strong>"Copy URL"</strong> feature and paste the link into an 
          <strong> Incognito Window</strong>. This ensures your own search history doesn't interfere with the 
          simulated local results.
        </p>
      </div>

      <footer className="mt-5 pt-5 border-top">
  <div className="row g-4 align-items-center">
    <div className="col-md-6 text-center text-md-start">
      <p className="small mb-0">
        &copy; {new Date().getFullYear()} Local Search Simulator. All rights reserved.
      </p>
    </div>
    <div className="col-md-6 text-center text-md-end">
      <nav className="d-flex justify-content-center justify-content-md-end gap-3 small">
        <a href="/privacy" className="text-decoration-none opacity-75 hover-opacity-100">Privacy Policy</a>
        <a href="/terms" className="text-decoration-none opacity-75 hover-opacity-100">Terms & Conditions</a>
        <a href="/about" className="text-decoration-none opacity-75 hover-opacity-100">About</a>
      </nav>
    </div>
  </div>
  
  <div className="row mt-4">
    <div className="col-12 text-center small opacity-50">
      <p style={{ fontSize: '0.75rem' }}>
        <strong>SEO Note:</strong> This tool is 
      designed for research purposes. It simulates localized search environments to help 
      professionals analyze regional intent accurately.
      </p>
    </div>
  </div>
</footer>
      </div>
    </main>
    </>
  );
}