"use client";

import { useState } from "react";

// ─── Types ───────────────────────────────────────────────
interface OrganicResult {
  position: number;
  title: string;
  link: string;
  displayed_link: string;
  snippet: string;
  favicon?: string;
  thumbnail?: string;
  sitelinks?: { inline: { title: string; link: string }[] };
}

interface LocalPlace {
  position: number;
  title: string;
  address: string;
  type: string;
  rating?: number;
  reviews?: number;
  reviews_original?: string;
  price?: string;
  description?: string;
  thumbnail?: string;
}

interface KnowledgeGraph {
  title: string;
  type?: string;
  description?: string;
  header_images?: { image: string; source: string }[];
  source?: { name: string; link: string };
}

interface RelatedQuestion {
  question: string;
  snippet?: string;
  title?: string;
  link?: string;
  list?: string[];
}

interface RelatedSearch {
  query: string;
  link: string;
}

interface SearchData {
  organic_results: OrganicResult[];
  local_results?: { places: LocalPlace[] };
  knowledge_graph?: KnowledgeGraph;
  related_questions?: RelatedQuestion[];
  related_searches?: RelatedSearch[];
  search_information?: { total_results: number; time_taken_displayed: number };
  things_to_know?: { buttons: any[] };
  q: string;
  location: string;
  page: number;
}

// ─── Helpers ─────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span style={{ color: "#f4b400", fontSize: 13, letterSpacing: 1 }}>
      {"★".repeat(full)}
      {half ? "½" : ""}
      {"☆".repeat(5 - full - (half ? 1 : 0))}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  async function search(p = 1) {
    if (!keyword || !location) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&page=${p}`
      );
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setData({ ...json, page: p });
        setSubmitted(true);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  // ── HOME PAGE ────────────────────────────────────────────
  if (!submitted) {
    return (
      <>
        <style>{homeStyles}</style>
        <div className="home-wrap">
          <div className="home-logo">
            <span>S</span><span>E</span><span>R</span><span>P</span><span>T</span><span>l</span>
          </div>
          <div className="home-form">
            <div className="input-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                placeholder="Search keyword..."
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && search(1)}
              />
            </div>
            <div className="input-wrap" style={{ position: "relative" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <input
                placeholder="Location (e.g. Austin, TX, US)"
                value={location}
                onChange={async e => {
                  const val = e.target.value;
                  setLocation(val);
                  if (val.length < 2) { setSuggestions([]); return; }
                  const res = await fetch(`/api/location?q=${encodeURIComponent(val)}`);
                  const json = await res.json();
                  setSuggestions(json);
                }}
                onKeyDown={e => e.key === "Enter" && search(1)}
              />
              {suggestions.length > 0 && (
                <div className="dropdown">
                  {suggestions.map((s, i) => (
                    <div key={i} className="dropdown-item" onClick={() => { setLocation(s); setSuggestions([]); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="btn-row">
              <button type="button" className="btn-ghost" onClick={() => search(1)} disabled={loading}>
                {loading ? "Searching..." : "SERP Search"}
              </button>
              <button type="button" className="btn-primary" onClick={() => search(1)} disabled={loading}>
                Search
              </button>
            </div>
          </div>
          {error && <p style={{ color: "red", marginTop: 16 }}>{error}</p>}
        </div>
      </>
    );
  }

  // ── RESULTS PAGE ─────────────────────────────────────────
  const { organic_results, local_results, knowledge_graph, related_questions, related_searches, search_information, page } = data!;

  return (
    <>
      <style>{resultsStyles}</style>

      {/* Sticky Header */}
      <header className="r-header">
        <div className="r-header-logo" onClick={() => { setSubmitted(false); setData(null); setKeyword(""); setLocation(""); }}>
          <span>S</span><span>E</span><span>R</span><span>P</span><span>T</span><span>l</span>
        </div>
        <div className="r-search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && search(1)} />
          {loading && <div className="spinner" />}
        </div>
      </header>

      {loading && <div className="progress-bar" />}

      <div className="r-body">
        {/* LEFT COLUMN */}
        <div className="r-left">

          {/* Search info */}
          {search_information && (
            <p className="search-info">
              About {search_information.total_results?.toLocaleString()} results ({search_information.time_taken_displayed}s)
              &nbsp;·&nbsp; <strong>{keyword}</strong> in {data?.location}
            </p>
          )}

          {/* ── LOCAL PLACES ─────────────────────────────── */}
          {local_results?.places?.length ? (
            <div className="section local-section">
              <h2 className="section-title">Places</h2>
              <div className="places-list">
                {local_results.places.map((p, i) => (
                  <div key={i} className="place-card">
                    {p.thumbnail && <img src={p.thumbnail} alt={p.title} className="place-thumb" onError={e => (e.currentTarget.style.display = "none")} />}
                    <div className="place-info">
                      <div className="place-name">{p.title}</div>
                      <div className="place-meta">
                        {p.rating && <><StarRating rating={p.rating} /> <span className="place-reviews">{p.reviews_original}</span></>}
                        {p.price && <span className="place-price"> · {p.price}</span>}
                        {p.type && <span className="place-type"> · {p.type}</span>}
                      </div>
                      <div className="place-address">{p.address}</div>
                      {p.description && <div className="place-desc">{p.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* ── ORGANIC RESULTS ───────────────────────────── */}
          <div className="section">
            {organic_results.map((r, i) => (
              <div key={i} className="organic-item">
                <div className="org-source">
                  {r.favicon && <img src={r.favicon} alt="" className="org-favicon" onError={e => (e.currentTarget.style.display = "none")} />}
                  <span className="org-breadcrumb">{r.displayed_link}</span>
                </div>
                <span className="org-title" onClick={() => window.open(r.link, "_blank")}>
                  {r.title}
                </span>
                <p className="org-snippet">{r.snippet}</p>
                {r.sitelinks?.inline?.length ? (
                  <div className="sitelinks">
                    {r.sitelinks.inline.map((s, j) => (
                      <span key={j} className="sitelink" onClick={() => window.open(s.link, "_blank")}>{s.title}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {/* ── PEOPLE ALSO ASK ───────────────────────────── */}
          {related_questions?.length ? (
            <div className="section">
              <h2 className="section-title">People also ask</h2>
              {related_questions.map((q, i) => (
                <div key={i} className="paa-item">
                  <div className="paa-question" onClick={() => setOpenQuestion(openQuestion === i ? null : i)}>
                    <span>{q.question}</span>
                    <span className="paa-chevron">{openQuestion === i ? "▲" : "▼"}</span>
                  </div>
                  {openQuestion === i && (
                    <div className="paa-answer">
                      {q.snippet && <p>{q.snippet}</p>}
                      {q.list && <ul>{q.list.map((l, j) => <li key={j}>{l}</li>)}</ul>}
                      {q.link && (
                        <a href="#" onClick={e => { e.preventDefault(); window.open(q.link!, "_blank"); }} className="paa-source">
                          {q.title}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}

          {/* ── RELATED SEARCHES ──────────────────────────── */}
          {related_searches?.length ? (
            <div className="section">
              <h2 className="section-title">Related searches</h2>
              <div className="related-grid">
                {related_searches.map((r, i) => (
                  <div key={i} className="related-chip" onClick={() => { setKeyword(r.query); search(1); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#70757a" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    {r.query}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Pagination */}
          {organic_results.length > 0 && (
            <div className="pagination">
              <div className="page-logo"><span>S</span><span>E</span><span>R</span><span>P</span><span>T</span><span>l</span></div>
              <button type="button" className="page-btn" onClick={() => search(page - 1)} disabled={page === 1}>← Prev</button>
              <span className="page-current">{page}</span>
              <button type="button" className="page-btn" onClick={() => search(page + 1)}>Next →</button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — Knowledge Graph */}
        {knowledge_graph && (
          <aside className="r-right">
            <div className="kg-card">
              {knowledge_graph.header_images?.length ? (
                <div className="kg-images">
                  {knowledge_graph.header_images.slice(0, 4).map((img, i) => (
                    <img key={i} src={img.image} alt="" className="kg-img" onError={e => (e.currentTarget.style.display = "none")} />
                  ))}
                </div>
              ) : null}
              <h2 className="kg-title">{knowledge_graph.title}</h2>
              {knowledge_graph.type && <p className="kg-type">{knowledge_graph.type}</p>}
              {knowledge_graph.description && <p className="kg-desc">{knowledge_graph.description}</p>}
              {knowledge_graph.source && (
                <a href="#" className="kg-source" onClick={e => { e.preventDefault(); window.open(knowledge_graph.source!.link, "_blank"); }}>
                  {knowledge_graph.source.name}
                </a>
              )}
            </div>
          </aside>
        )}
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────
const homeStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Google Sans', arial, sans-serif; background: #fff; }
  .home-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
  .home-logo { font-size: 72px; font-weight: 700; letter-spacing: -2px; margin-bottom: 28px; user-select: none; }
  .home-logo span:nth-child(1){color:#4285F4} .home-logo span:nth-child(2){color:#EA4335} .home-logo span:nth-child(3){color:#FBBC05} .home-logo span:nth-child(4){color:#4285F4} .home-logo span:nth-child(5){color:#34A853} .home-logo span:nth-child(6){color:#EA4335}
  .home-form { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 584px; }
  .input-wrap { display: flex; align-items: center; border: 1px solid #dfe1e5; border-radius: 24px; padding: 10px 16px; gap: 10px; background: #fff; transition: box-shadow .2s; }
  .input-wrap:focus-within { box-shadow: 0 1px 6px rgba(32,33,36,.28); border-color: transparent; }
  .input-wrap input { border: none; outline: none; width: 100%; font-size: 16px; color: #202124; background: transparent; }
  .dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #dfe1e5; border-top: none; border-radius: 0 0 24px 24px; box-shadow: 0 4px 6px rgba(32,33,36,.2); z-index: 20; overflow: hidden; }
  .dropdown-item { display: flex; align-items: center; gap: 10px; padding: 10px 20px; font-size: 14px; cursor: pointer; color: #202124; }
  .dropdown-item:hover { background: #f8f9fa; }
  .btn-row { display: flex; gap: 12px; justify-content: center; margin-top: 8px; }
  .btn-ghost { background: #f8f9fa; border: 1px solid #f8f9fa; border-radius: 4px; color: #3c4043; font-size: 14px; padding: 9px 20px; cursor: pointer; }
  .btn-ghost:hover { border-color: #dadce0; box-shadow: 0 1px 2px rgba(0,0,0,.1); }
  .btn-primary { background: #4285F4; border: 1px solid #4285F4; border-radius: 4px; color: #fff; font-size: 14px; padding: 9px 20px; cursor: pointer; }
  .btn-primary:hover { background: #1a73e8; }
`;

const resultsStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: arial, sans-serif; background: #fff; color: #202124; }

  /* Header */
  .r-header { display: flex; align-items: center; gap: 20px; padding: 8px 24px; border-bottom: 1px solid #ebebeb; position: sticky; top: 0; background: #fff; z-index: 100; }
  .r-header-logo { font-size: 26px; font-weight: 700; letter-spacing: -1px; cursor: pointer; user-select: none; flex-shrink: 0; }
  .r-header-logo span:nth-child(1){color:#4285F4} .r-header-logo span:nth-child(2){color:#EA4335} .r-header-logo span:nth-child(3){color:#FBBC05} .r-header-logo span:nth-child(4){color:#4285F4} .r-header-logo span:nth-child(5){color:#34A853} .r-header-logo span:nth-child(6){color:#EA4335}
  .r-search-box { display: flex; align-items: center; border: 1px solid #dfe1e5; border-radius: 24px; padding: 8px 16px; gap: 10px; flex: 1; max-width: 584px; transition: box-shadow .2s; }
  .r-search-box:focus-within { box-shadow: 0 1px 6px rgba(32,33,36,.28); border-color: transparent; }
  .r-search-box input { border: none; outline: none; width: 100%; font-size: 16px; color: #202124; background: transparent; }
  .spinner { width: 18px; height: 18px; border: 2px solid #e8eaed; border-top-color: #4285F4; border-radius: 50%; animation: spin .6s linear infinite; flex-shrink: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .progress-bar { height: 3px; background: linear-gradient(90deg,#4285F4,#EA4335,#FBBC05,#34A853); background-size:300% 100%; animation: loadBar 1.5s linear infinite; }
  @keyframes loadBar { 0%{background-position:0%} 100%{background-position:100%} }

  /* Layout */
  .r-body { display: flex; gap: 40px; max-width: 1200px; margin: 0 auto; padding: 20px 24px 60px; }
  .r-left { flex: 1; min-width: 0; max-width: 660px; }
  .r-right { width: 340px; flex-shrink: 0; }

  /* Sections */
  .section { margin-bottom: 28px; }
  .section-title { font-size: 20px; font-weight: 400; color: #202124; margin-bottom: 12px; }
  .search-info { font-size: 13px; color: #70757a; margin-bottom: 16px; }

  /* Local Places */
  .local-section { border: 1px solid #e8eaed; border-radius: 12px; padding: 16px; margin-bottom: 28px; }
  .places-list { display: flex; flex-direction: column; gap: 16px; }
  .place-card { display: flex; gap: 14px; padding-bottom: 16px; border-bottom: 1px solid #f1f3f4; }
  .place-card:last-child { border-bottom: none; padding-bottom: 0; }
  .place-thumb { width: 72px; height: 72px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
  .place-info { flex: 1; min-width: 0; }
  .place-name { font-size: 16px; font-weight: 500; color: #1a73e8; margin-bottom: 3px; cursor: pointer; }
  .place-name:hover { text-decoration: underline; }
  .place-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; font-size: 13px; margin-bottom: 3px; }
  .place-reviews { color: #70757a; font-size: 13px; }
  .place-price { color: #70757a; font-size: 13px; }
  .place-type { color: #70757a; font-size: 13px; }
  .place-address { font-size: 13px; color: #70757a; }
  .place-desc { font-size: 13px; color: #4d5156; margin-top: 2px; }

  /* Organic */
  .organic-item { margin-bottom: 28px; }
  .org-source { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .org-favicon { width: 18px; height: 18px; border-radius: 50%; }
  .org-breadcrumb { font-size: 13px; color: #4d5156; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 540px; }
  .org-title { font-size: 20px; font-weight: 400; color: #1a0dab; cursor: pointer; line-height: 1.3; display: block; margin-bottom: 4px; }
  .org-title:hover { text-decoration: underline; }
  .org-snippet { font-size: 14px; color: #4d5156; line-height: 1.58; }
  .sitelinks { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  .sitelink { font-size: 13px; color: #1a0dab; cursor: pointer; border: 1px solid #dadce0; border-radius: 4px; padding: 4px 10px; }
  .sitelink:hover { background: #f8f9fa; text-decoration: underline; }

  /* People Also Ask */
  .paa-item { border: 1px solid #e8eaed; border-radius: 8px; margin-bottom: 8px; overflow: hidden; }
  .paa-question { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; cursor: pointer; font-size: 15px; font-weight: 400; color: #202124; background: #fff; }
  .paa-question:hover { background: #f8f9fa; }
  .paa-chevron { font-size: 11px; color: #70757a; }
  .paa-answer { padding: 12px 16px; border-top: 1px solid #e8eaed; background: #fafafa; font-size: 14px; color: #4d5156; line-height: 1.6; }
  .paa-answer ul { padding-left: 20px; margin-top: 6px; }
  .paa-answer li { margin-bottom: 4px; }
  .paa-source { display: block; margin-top: 10px; font-size: 13px; color: #1a0dab; text-decoration: none; }
  .paa-source:hover { text-decoration: underline; }

  /* Related Searches */
  .related-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .related-chip { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 1px solid #e8eaed; border-radius: 8px; font-size: 14px; color: #202124; cursor: pointer; }
  .related-chip:hover { background: #f8f9fa; }

  /* Pagination */
  .pagination { display: flex; align-items: center; gap: 4px; margin-top: 36px; justify-content: center; }
  .page-logo { font-size: 26px; font-weight: 700; letter-spacing: -1px; margin-right: 8px; user-select: none; }
  .page-logo span:nth-child(1){color:#4285F4} .page-logo span:nth-child(2){color:#EA4335} .page-logo span:nth-child(3){color:#FBBC05} .page-logo span:nth-child(4){color:#4285F4} .page-logo span:nth-child(5){color:#34A853} .page-logo span:nth-child(6){color:#EA4335}
  .page-btn { background: none; border: none; cursor: pointer; font-size: 14px; color: #1a0dab; padding: 8px 14px; border-radius: 4px; }
  .page-btn:hover { background: #f8f9fa; text-decoration: underline; }
  .page-btn:disabled { color: #aaa; cursor: default; }
  .page-current { font-size: 14px; color: #202124; font-weight: 500; padding: 8px 12px; border-bottom: 3px solid #4285F4; }

  /* Knowledge Graph */
  .kg-card { border: 1px solid #e8eaed; border-radius: 12px; padding: 20px; position: sticky; top: 80px; }
  .kg-images { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 16px; border-radius: 8px; overflow: hidden; }
  .kg-img { width: 100%; height: 100px; object-fit: cover; }
  .kg-title { font-size: 24px; font-weight: 400; margin-bottom: 4px; }
  .kg-type { font-size: 14px; color: #70757a; margin-bottom: 12px; }
  .kg-desc { font-size: 14px; color: #4d5156; line-height: 1.6; margin-bottom: 12px; }
  .kg-source { font-size: 13px; color: #1a0dab; text-decoration: none; }
  .kg-source:hover { text-decoration: underline; }

  @media (max-width: 900px) {
    .r-right { display: none; }
    .related-grid { grid-template-columns: 1fr; }
  }
`;
