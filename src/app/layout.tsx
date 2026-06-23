import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reunion Registration",
  description: "Bangla reunion registration and participant management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
