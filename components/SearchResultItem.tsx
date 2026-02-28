import { SearchResult } from "../types/search";

export default function SearchResultItem({ r }: { r: SearchResult }) {
  return (
    <div className="result">
      <a href={r.link} target="_blank" rel="noopener noreferrer">
        <h3>{r.title}</h3>
      </a>
      <div className="url">{r.link}</div>
      <p>{r.snippet}</p>
    </div>
  );
}