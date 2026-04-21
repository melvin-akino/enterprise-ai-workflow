import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Enterprise AI Workflow Agent",
  description: "AI-powered workflow management with Claude reasoning",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--bg2)",
              color: "var(--text)",
              border: "1px solid var(--border2)",
              fontFamily: "var(--font-sans), sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
