import type { Metadata } from "next";
import { Inter } from "next/font/google";
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import SessionGuard from "@/components/SessionGuard";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pathly",
  description: "Universidad Virtual Continental — Cloud Native Education Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} antialiased dark:bg-slate-950 transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionGuard />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}