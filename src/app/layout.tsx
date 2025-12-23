import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/hooks/useAuth"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Official ID - Ekosistem Digital untuk Profesional",
  description: "Platform kartu bisnis digital, networking, dan organisasi untuk profesional Indonesia",
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
    title: "Official ID - Ekosistem Digital untuk Profesional",
    description: "Platform kartu bisnis digital, networking, dan organisasi untuk profesional Indonesia",
    type: "website",
    locale: "id_ID",
    siteName: "Official ID",
  },
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
