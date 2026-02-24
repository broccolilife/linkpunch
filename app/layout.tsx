import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/600.css";

export const metadata: Metadata = {
  title: "Aerolinks — Your 3D Link-in-Bio",
  description:
    "A stunning 3D Linktree-style experience with real-time creator analytics, theme customization, and immersive WebGL banners.",
  keywords: ["link in bio", "linktree alternative", "3D links", "creator analytics", "social links"],
  authors: [{ name: "Aerolinks" }],
  openGraph: {
    title: "Aerolinks — Your 3D Link-in-Bio",
    description:
      "A stunning 3D Linktree-style experience with real-time creator analytics and theme customization.",
    type: "website",
    locale: "en_US",
    siteName: "Aerolinks"
  },
  twitter: {
    card: "summary_large_image",
    title: "Aerolinks — Your 3D Link-in-Bio",
    description:
      "A stunning 3D Linktree-style experience with real-time creator analytics and theme customization."
  },
  robots: {
    index: true,
    follow: true
  },
  viewport: {
    width: "device-width",
    initialScale: 1
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
