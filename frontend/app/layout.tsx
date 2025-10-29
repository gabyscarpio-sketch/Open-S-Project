import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medical AI Assistant",
  description: "AI-powered medical assistant for patient queries",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
