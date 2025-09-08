import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import { LeadProvider } from "./context/LeadContext";
import { NavigationProvider } from "./context/NavigationContext";
import NavigationWrapper from "./components/NavigationWrapper";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lead CRM",
  description: "Simple CRM for lead management",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <LeadProvider>
          <NavigationProvider>
            <div className="flex flex-col h-screen">
              <NavigationWrapper />
              <main className="flex-1 overflow-y-auto p-6">
                {children}
              </main>
            </div>
          </NavigationProvider>
        </LeadProvider>
      </body>
    </html>
  );
}
