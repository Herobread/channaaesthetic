import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata = {
  title: "Channa Aesthetic | Advanced Skin & Aesthetic Clinic",
  description: "Enhancing Your Natural Beauty",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="font-sans bg-[#FAF8F5] text-[#1C1917] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
