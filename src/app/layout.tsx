import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/hooks/useAuth"

const inter = Inter({ subsets: ["latin"] })

import { getSeoSettings } from "@/lib/actions/seo"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSeoSettings()

  const title = settings?.site_title || "Official ID - Ekosistem Digital untuk Profesional"
  const description = settings?.site_description || "Platform kartu bisnis digital, networking, dan organisasi untuk profesional Indonesia"
  const keywords = settings?.keywords || ["official id", "kartu nama digital", "bisnis", "profesional"]

  return {
    title,
    description,
    keywords,
    manifest: "/manifest.json",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/logo.png",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Official ID",
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "id_ID",
      siteName: "Official ID",
      images: [
        settings?.og_image_facebook && { url: settings.og_image_facebook, width: 1200, height: 630 },
        settings?.og_image_twitter && { url: settings.og_image_twitter, width: 1200, height: 600 },
        settings?.og_image_linkedin && { url: settings.og_image_linkedin, width: 1200, height: 627 },
        settings?.og_image_google && { url: settings.og_image_google, width: 1200, height: 630 },
      ].filter(Boolean) as any,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: settings?.og_image_twitter ? [settings.og_image_twitter] : [],
    },
  }
}

export const viewport: Viewport = {
  themeColor: "#2D7C88",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
