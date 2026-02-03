import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "関西MAP - トイレ・喫煙所マップ",
  description: "大阪を中心とした関西エリアの無料トイレと喫煙所を地図で探せるアプリ",
  keywords: ["トイレ", "喫煙所", "大阪", "関西", "地図", "マップ"],
  openGraph: {
    title: "関西MAP - トイレ・喫煙所マップ",
    description: "大阪を中心とした関西エリアの無料トイレと喫煙所を地図で探せるアプリ",
    type: "website",
    locale: "ja_JP",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3B82F6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
