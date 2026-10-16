import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#09090b",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://official.id"),
  title: {
    default: "official.id — Innovative 3D Animated QR Code & WebAR Studio",
    template: "%s | official.id — 3D Animated QR Code",
  },
  description:
    "official.id is the world's leading innovative platform for creating interactive 3D Voxel Animated QR Codes. Featuring 100% scan-ready printed QR codes, whitelabel shortlinks, and real-time WebAR experiences directly in mobile browsers.",
  keywords: [
    "QR CODE ANIMATE",
    "ANIMATED QR CODE",
    "INNOVATIVE QR CODE GENERATOR",
    "3d animated qr code",
    "3d voxel qr code",
    "webar qr code",
    "augmented reality qr code",
    "whitelabel qr code generator",
    "custom qr code studio",
    "scannable 3d qr code",
    "interactive qr code",
    "official.id",
  ],
  authors: [{ name: "Harizal", url: "https://instagram.com/harizal.official" }],
  creator: "Harizal",
  publisher: "official.id",
  applicationName: "official.id 3D Voxel QR Code Studio",
  category: "Technology",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://official.id",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://official.id",
    siteName: "official.id",
    title: "official.id — Innovative 3D Animated QR Code Generator & WebAR Studio",
    description:
      "Transform any URL into a stunning interactive 3D Voxel Animated QR Code that is 100% scannable by smartphone cameras.",
    images: [
      {
        url: "https://official.id/og-image.png",
        width: 1200,
        height: 630,
        alt: "official.id — 3D Voxel QR Code Animate Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "official.id — Innovative 3D Animated QR Code Generator & WebAR Studio",
    description:
      "Innovative QR Code Platform: Create interactive 3D Voxel Animated QR Codes with real-time WebAR.",
    images: ["https://official.id/og-image.png"],
    creator: "@harizal",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": "https://official.id/#webapp",
      name: "official.id — Innovative 3D Animated QR Code Generator",
      url: "https://official.id",
      applicationCategory: "DesignApplication",
      operatingSystem: "All",
      browserRequirements: "Requires WebGL & WebRTC support",
      description:
        "Innovative platform for creating interactive 3D Voxel Animated QR Codes that are instantly scannable and print-ready.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      creator: {
        "@type": "Person",
        name: "Harizal",
        url: "https://instagram.com/harizal.official",
        sameAs: ["https://instagram.com/harizal.official", "https://wa.me/6281283835553"],
      },
    },
    {
      "@type": "Organization",
      "@id": "https://official.id/#organization",
      name: "official.id",
      url: "https://official.id",
      logo: "https://official.id/favicon.ico",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+6281283835553",
        contactType: "customer service",
        availableLanguage: ["English", "Indonesian"],
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
