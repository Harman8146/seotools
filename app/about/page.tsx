import { SiteFooter } from "@/components/site-footer";

export default function About() {
  return (
    <>
    <main className="container py-5" style={{ maxWidth: "800px" }}>
      <h1 className="fw-bold mb-4">About Local Search Simulator</h1>
      
      <p className="lead">
        Our platform empowers SEO professionals and marketers to view the internet through 
        a local lens. We bridge the gap between global data and local intent.
      </p>

      <div className="card bg-light border-0 p-4 my-5 rounded-4">
        <h2 className="h5 fw-bold text-primary">How It Works</h2>
        <p className="mb-0">
          Instead of using proxies or VPNs, our tool utilizes advanced search parameters to 
          inform search engines of a specific geographic intent. This allows for 
          hyper-accurate previews of local map packs, organic results, and localized 
          advertisements as they appear to real users in a specific city.
        </p>
      </div>

      <h2 className="h4 fw-bold mt-5">Core Advantages</h2>
      <div className="row g-4 mt-1">
        <div className="col-md-6">
          <div className="p-3 border rounded-3 h-100">
            <strong>Privacy-Centric</strong>
            <p className="small opacity-75 mb-0">No account required and no search history is ever recorded.</p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="p-3 border rounded-3 h-100">
            <strong>Instant Results</strong>
            <p className="small opacity-75 mb-0">Powered by a local database for zero-latency suggestions.</p>
          </div>
        </div>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}   
