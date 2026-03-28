import type { Metadata } from "next";
import { Exo_2, Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const exo2 = Exo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-exo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MyCommerce",
  description: "Loja virtual completa",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={exo2.variable}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="flex min-h-dvh w-full">
            <main className="flex-1">
              <Header />
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
