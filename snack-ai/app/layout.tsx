import "./globals.css";
import FloatingShapes from "./components/ui/FloatingShapes";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Snack Coach",
  icons: {
    icon: "/website_icon.png",
    shortcut: "/website_icon.png",
    apple: "/website_icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="relative min-h-screen overflow-x-hidden">
        <FloatingShapes />
        {children}
      </body>
    </html>
  );
}
