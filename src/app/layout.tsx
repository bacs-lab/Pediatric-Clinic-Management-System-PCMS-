import type { Metadata } from "next";
import { AuthHashHandler } from "@/components/auth-hash-handler";
import "./globals.css";

export const metadata: Metadata = {
  title: "PCMS v2",
  description: "Pediatric Clinic Management System v2",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthHashHandler />
        {children}
      </body>
    </html>
  );
}
