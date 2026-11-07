import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import { OverlayScroll } from "@/components/shop/overlay-scroll";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Trinity Styles",
    template: "%s · Trinity Styles",
  },
  description: "Contemporary clothing from Ghana. Virtual try-on, GHS checkout.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#eef3fb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GH"
      suppressHydrationWarning
      className={`${geist.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col text-foreground">
        <ThemeProvider>
          <OverlayScroll />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
