import "./globals.css";

export const metadata = {
  title: "ProjectPilot — AI-Powered Final-Year Project Writing Platform",
  description: "Create source-grounded final-year project chapter drafts from your department guideline and project documents, with a 500-word minimum and reviewed project visuals.",
  keywords: [
    "final year project",
    "academic research writing",
    "dissertation helper",
    "thesis writing platform",
    "project topic generator",
    "APA citation generator",
    "Nigerian university project"
  ],
  authors: [{ name: "ProjectPilot Academic AI" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
