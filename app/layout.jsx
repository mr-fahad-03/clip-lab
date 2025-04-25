import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import PremiumPopup from "@/components/premium-popup"

import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "MyTube - YouTube Clone",
  description: "A YouTube clone built with Next.js and the YouTube API",
  generator: "v0.dev",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <PremiumPopup />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
