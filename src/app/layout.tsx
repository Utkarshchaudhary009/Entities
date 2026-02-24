import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Topbar } from "@/components/layout/topbar";
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
      <html lang="en" className={inter.variable}>
        <body className="antialiased">
          {/* Topbar reads sidebar state from useSidebarStore directly — no provider needed at root */}
          <Topbar />
          {/* pt-16 offsets the fixed 64px topbar so content is never hidden beneath it */}
          <div className="flex min-h-[calc(100vh-4rem)] pt-16">{children}</div>
          <Toaster position="top-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
