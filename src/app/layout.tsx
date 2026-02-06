import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { NotificationProvider } from "@/components/NotificationProvider";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MomentoFlow - Project Management Tool",
  description: "Advanced project management and team synchronization tool. Built with TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: ["MomentoFlow", "Project Management", "Task Tracking", "Next.js", "TypeScript", "Tailwind CSS"],
  authors: [{ name: "MomentoFlow Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "MomentoFlow",
    description: "Modern project management for high-performance teams",
    url: "https://momentoflow.com",
    siteName: "MomentoFlow",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MomentoFlow",
    description: "Modern project management for high-performance teams",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} antialiased font-light bg-background text-foreground`}
        suppressHydrationWarning
      >
        <NotificationProvider>
          {children}
          <Toaster />
        </NotificationProvider>
      </body>
    </html>
  );
}
