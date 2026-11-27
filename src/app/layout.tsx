import type { Metadata } from "next";
import { Public_Sans, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const sans = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-public" });
const serif = Source_Serif_4({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-source-serif" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: "Travel Cart UK | Bookings",
  description: "Internal booking management dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="bg-canvas font-sans text-[15px] leading-6 text-ink antialiased">
        {children}
        <Toaster
          position="top-right"
          theme="light"
          toastOptions={{ style: { fontFamily: "var(--font-public), system-ui, sans-serif", fontSize: "14px" } }}
        />
      </body>
    </html>
  );
}
