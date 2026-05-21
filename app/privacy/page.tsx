import { SiteFooter } from "@/components/site-footer";

export default function PrivacyPolicy() {
  return (
    <>
    <main className="container py-5" style={{ maxWidth: "800px" }}>
      <h1 className="fw-bold mb-4">Privacy Policy</h1>
      <p className="text-muted">Effective Date: February 7, 2026</p>
      
      <section className="mt-4">
        <h2 className="h4 fw-bold">1. Data Minimalization</h2>
        <p>
          Our tool is built on a &quot;privacy-first&quot; architecture. We do not store, collect, or monitor your 
          search keywords, location selections, or the URLs generated during your session.
        </p>
      </section>

      <section className="mt-4">
        <h2 className="h4 fw-bold">2. Third-Party Interactions</h2>
        <p>
          This simulator generates direct links to Google Search. When clicking these links, you are 
          interacting directly with Google&apos;s servers and are subject to their specific Privacy Policy 
          and data collection practices.
        </p>
      </section>

      <section className="mt-4">
        <h2 className="h4 fw-bold">3. Browser Cookies</h2>
        <p>
          We do not use tracking cookies. Your browser may use local storage purely to save your 
          interface preferences, such as Dark Mode settings.
        </p>
      </section>
    </main>
    <SiteFooter />
    </>
  );
}
