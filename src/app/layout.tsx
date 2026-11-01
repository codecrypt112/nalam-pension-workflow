import type { Metadata } from "next";
import { Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";

const notoSansTamil = Noto_Sans_Tamil({
  variable: "--font-tamil",
  subsets: ["tamil", "latin"],
});

export const metadata: Metadata = {
  title: "நலம் — ஓய்வூதியப் பணிப்பாய்வு",
  description: "முதுமை / விதவை உதவித்தொகை பணிப்பாய்வு கருவி",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ta" className={`${notoSansTamil.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 font-sans text-slate-900">
        {children}
      </body>
    </html>
  );
}
