import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
    default: "official.id — QR CODE ANIMATE, Animasi QR Code & QR Code Generator Inovative",
    template: "%s | official.id — QR Code Animate",
  },
  description:
    "official.id adalah platform QR Code Generator Inovative pertama di dunia untuk membuat QR Code Animate & Animasi QR Code 3D Voxel interaktif. Dilengkapi fitur QR cetak fisik siap scan, link share whitelabel, dan pengalaman WebAR langsung dari kamera smartphone.",
  keywords: [
    "QR CODE ANIMATE",
    "ANIMASI QR CODE",
    "QR CODE GENERATOR INOVATIVE",
    "qr code animate",
    "animasi qr code",
    "qr code generator inovative",
    "innovative qr code generator",
    "3d animated qr code",
    "animated qr code generator",
    "qr code bergerak",
    "qr code pohon 3d",
    "webar qr code generator",
    "custom qr code whitelabel",
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
    locale: "id_ID",
    url: "https://official.id",
    siteName: "official.id",
    title: "official.id — QR CODE ANIMATE & Innovative 3D Animated QR Code Generator",
    description:
      "Ubah URL apa pun menjadi Animasi QR Code 3D Voxel interaktif yang memukau dan 100% dapat discan kamera smartphone.",
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
    title: "official.id — QR CODE ANIMATE & Innovative 3D Animated QR Code Generator",
    description:
      "Platform QR Code Generator Inovative: Buat Animasi QR Code 3D Voxel dengan WebAR interaktif.",
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
      name: "official.id — QR Code Animate & Innovative QR Code Generator",
      url: "https://official.id",
      applicationCategory: "DesignApplication",
      operatingSystem: "All",
      browserRequirements: "Requires WebGL & WebRTC support",
      description:
        "Generator inovatif untuk membuat QR Code Animate dan Animasi QR Code 3D Voxel interaktif yang dapat dicetak dan discan langsung.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "IDR",
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
        availableLanguage: ["Indonesian", "English"],
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
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
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
