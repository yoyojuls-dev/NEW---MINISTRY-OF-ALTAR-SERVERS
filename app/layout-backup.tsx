// Emergency minimal layout.tsx to fix chunk loading error
// Replace your current app/layout.tsx with this temporarily

import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ministry of Altar Servers Management System",
  description: "Digital management system for altar server ministry",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}