import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tander Intelligence Terminal",
  description: "全球情报中心 · AI洞察 · 实时情报流 · 市场信号监控",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 👇 强行注入军工级科幻字体，确保 100% 加载 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>{children}</body>
    </html>
  );
}