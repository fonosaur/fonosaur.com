import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FONOSAUR",
  description: "Music, field notes, and the things I'm exploring.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0a0a0c" }}>{children}</body>
    </html>
  );
}
