import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boxing Forum",
  description: "A real-time boxing discussion forum",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <AuthProvider>
          <Header />
          <main className="max-w-5xl mx-auto">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
