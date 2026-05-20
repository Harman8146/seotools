export default function Terms() {
  return (
    <main className="container py-5" style={{ maxWidth: "800px" }}>
      <h1 className="fw-bold mb-4">Terms and Conditions</h1>
      
      <section className="mt-4">
        <h2 className="h4 fw-bold">1. Permitted Use</h2>
        <p>
          The Local SERP Simulator is intended for manual SEO research, ad verification, and 
          educational purposes only. Users must comply with all third-party search 
          engine terms of service while using generated links.
        </p>
      </section>

      <section className="mt-4">
        <h2 className="h4 fw-bold">2. Service Limitations</h2>
        <p>
          We provide this tool "as is." Search results are subject to real-time algorithmic 
          changes, personalized browser history, and IP-based security measures implemented 
          by search engines.
        </p>
      </section>

      <section className="mt-4">
        <h2 className="h4 fw-bold">3. Disclaimer</h2>
        <p>
          We are not liable for any temporary service interruptions or IP rate-limiting (such as 403 
          Forbidden errors) that may occur due to high-frequency search activity.
        </p>
      </section>
    </main>
  );
}