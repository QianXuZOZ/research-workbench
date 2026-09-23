import type { Metadata } from "next";
import "@fontsource-variable/noto-sans-sc";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "电研工作台", template: "%s · 电研工作台" },
  description: "面向电力系统科研人员的个人项目、论文、专利、成长与晋升工作台。",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
