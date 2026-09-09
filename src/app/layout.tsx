import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SINYAL CRM",
  description: "Dashboard offline conversion tracking WhatsApp",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
