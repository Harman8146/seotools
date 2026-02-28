"use client";

import { useEffect, useState } from "react";

export default function SearchBar({
  onSearch
}: {
  onSearch: (q: string, location: string) => void;
}) {
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (loc.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const res = await fetch(`/api/location?q=${loc}`);
      const data = await res.json();
      setSuggestions(data);
    }, 300);

    return () => clearTimeout(timer);
  }, [loc]);

  return (
    <div className="search-box-wrapper">
      <div className="search-box">
        <input
          placeholder="Search"
          value={q}
          onChange={e => setQ(e.target.value)}
        />

        <div className="location-wrapper">
          <input
            placeholder="Location (Austin, Texas, United States)"
            value={loc}
            onChange={e => setLoc(e.target.value)}
          />

          {suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setLoc(s.label);
                    setSuggestions([]);
                  }}
                >
                  {s.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => onSearch(q, loc)}>Search</button>
      </div>
    </div>
  );
}