import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CollegePlanet",
  description: "Plan your path from your major to your target career.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
