import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - Ministry of Altar Servers",
  description: "Administrator panel for Ministry of Altar Servers Management System",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}