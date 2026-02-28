export type SearchResult = {
  title: string;
  link: string;
  snippet: string;
};

export type SearchResponse = {
  source: "google_cse" | "serpapi" | "google_html";
  results: SearchResult[];
  nextPage?: number;
};