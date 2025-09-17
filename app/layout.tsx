import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LeadProvider } from "./context/LeadContext";
import { MandateProvider } from "./context/MandateContext";
import { NavigationProvider } from "./context/NavigationContext";
import NavigationWrapper from "./components/NavigationWrapper";
import ErrorBoundary from "./components/ErrorBoundary";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Enterprise Lead Management System",
  description: "Professional Enterprise Lead Management & CRM System",
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
        <ErrorBoundary>
          <LeadProvider>
            <MandateProvider>
              <NavigationProvider>
                <div className="flex flex-col h-screen">
                  <NavigationWrapper />
                  <main className="flex-1 overflow-y-auto p-0">
                    {children}
                  </main>
                </div>
              </NavigationProvider>
            </MandateProvider>
          </LeadProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
