import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "কালাইয়া মাধ্যমিক বিদ্যালয় — প্রাক্তন শিক্ষার্থী পুনর্মিলনী ২০২৬",
  description: "কালাইয়া মাধ্যমিক বিদ্যালয়ের প্রাক্তন শিক্ষার্থী পুনর্মিলনী অনুষ্ঠান-২০২৬ রেজিস্ট্রেশন ও তথ্য ব্যবস্থাপনা",
  icons: { icon: "/kalaia_high_reunion_2026.png" },
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
