import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { SessionProvider } from "@/lib/session";
import Nav from "./Nav";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });

export const metadata = {
  title: "Innowise HR",
  description: "AI-assisted CV screening and interview checklists",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} min-h-screen font-sans antialiased`}>
        <LanguageProvider>
          <SessionProvider>
            <Nav />
            <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">{children}</main>
          </SessionProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
