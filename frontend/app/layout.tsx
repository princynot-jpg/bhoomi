import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bhoomi — Land acquisition, in clear view",
  description:
    "A unified workspace for tracking land acquisition, projects and district progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
