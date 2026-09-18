import type { Metadata } from "next";
import { NotificationListener } from '@/components/marketplace/NotificationListener';
import { PWARegistrar } from '@/components/marketplace/PWARegistrar';
import { db } from '@/server/db/client';
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

export const metadata = {
  title: 'Quick-Konnect - Find Trusted Local Professionals',
  description: 'Connect with reliable local service providers, compare quotes, hire confidently, and manage your service from one place.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Quick-Konnect',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
};


export const viewport = {
  themeColor: '#05070b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const chatwaySetting = await db.platformSetting.findUnique({
    where: { key: 'chatway_widget_code' },
  });
  const chatwayCode =
    typeof chatwaySetting?.value === 'string' && chatwaySetting.value.trim()
      ? chatwaySetting.value
      : '';
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}  {chatwayCode ? (
          <div dangerouslySetInnerHTML={{ __html: chatwayCode }} />
        ) : null}
          <NotificationListener />
        <PWARegistrar />
      </body>
    </html>
  );
}
