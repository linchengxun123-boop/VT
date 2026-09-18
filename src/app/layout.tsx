import type { Metadata, Viewport } from "next";
import { TrainingProvider } from "@/components/training-provider";
import "./globals.css";
export const metadata: Metadata = {
  title: "VT — 每一天，更准一点",
  description: "为 VALORANT 玩家设计的每日练枪计划。找到弱项，专注训练，记录坚持。",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#101211" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>
        <TrainingProvider>{children}</TrainingProvider>
      </body>
    </html>
  );
}
