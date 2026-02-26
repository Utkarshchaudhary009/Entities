import { ClerkProvider, GoogleOneTap } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Topbar } from "@/components/layout/topbar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Entities — Premium Fashion",
  description:
    "Discover premium fashion at Entities. Shop the latest collections.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable} suppressHydrationWarning>
        <body className="antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <GoogleOneTap />
            {/* Topbar reads sidebar state from useSidebarStore directly — no provider needed at root */}
            <Topbar />
            {/* pt-16 offsets the fixed 64px topbar. pb-16 offsets the bottom nav on mobile */}
            <div className="flex min-h-[calc(100vh-4rem)] pt-16 pb-16 md:pb-0">
              {children}
            </div>
            <BottomNav />
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
