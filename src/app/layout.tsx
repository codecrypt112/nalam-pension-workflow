import type { Metadata } from "next";
import { Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/i18n/locale";
import { dictionary } from "@/lib/i18n/dictionary";

const notoSansTamil = Noto_Sans_Tamil({
  variable: "--font-tamil",
  subsets: ["tamil", "latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = dictionary[locale];
  return {
    title: t.meta.title,
    description: t.meta.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${notoSansTamil.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 font-sans text-slate-900">
        {children}
      </body>
    </html>
  );
}
