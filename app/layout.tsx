
import { Geist } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";

export const metadata = {
   title: "lsearchFrom: free Google Search from Different Location",
  description:
    "Free keyword ranking checker to check your website’s Google search rankings on lsearchfrom. Track keyword positions, analyze SERP results, and improve SEO for free.",
  verification: {
    google: "TYDPejaagQSNZIRilcDbgSHd0CPqM7dxnOK7UpRT8yg",
  },
   robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.seoprotool.site/",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
