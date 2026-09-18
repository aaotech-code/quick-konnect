import type { Metadata } from "next";
import { NotificationListener } from '@/components/marketplace/NotificationListener';
import { PWARegistrar } from '@/components/marketplace/PWARegistrar';
import { db } from '@/server/db/client';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";

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
export default async function RootLayout({ children }: { children: React.ReactNode }) {
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
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
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
