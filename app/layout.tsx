
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";

export const metadata = {
   title: "Free Keyword Ranking Checker – Check Google Rankings Online",
  description:
    "Free keyword ranking checker to check your website’s Google search rankings instantly. Track keyword positions, analyze SERP results, and improve SEO for free.",
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
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
