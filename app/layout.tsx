import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Matei Loyalty",
  description: "Digitale Treuekarten für lokale Unternehmen",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
