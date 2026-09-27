import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import Nav from "./Nav";

export const metadata = {
  title: "HR Scout",
  description: "AI-assisted CV screening and interview checklists",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className="min-h-screen antialiased">
        <LanguageProvider>
          <Nav />
          <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
