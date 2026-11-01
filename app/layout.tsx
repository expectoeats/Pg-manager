import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'PG Manager',
  description: 'Manage your paying guest property',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PG Manager',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#F2F2F7',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.cdnfonts.com" crossOrigin="anonymous" />
        <link href="https://fonts.cdnfonts.com/css/sf-pro-display" rel="stylesheet" />
      </head>
      <body className="min-h-full font-sans bg-[#F2F2F7] text-[#1C1C1E] selection:bg-[#007AFF]/20 selection:text-[#007AFF]">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
