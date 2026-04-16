import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from "./context/ProfileContext";
import { ToastProvider } from "./context/ToastContext";
import { headers } from "next/headers";
import { getConfig } from "@/utils/config";
import { redirect } from "next/navigation";
import profileData from "@/data/profile.json";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: profileData.metadata?.title || "Responsive Profile Page",
  description: profileData.metadata?.description || "Responsive Profile Page converted to Next.js",
  icons: {
    icon: profileData.metadata?.iconUrl || '/favicon.ico',
  },
  openGraph: {
    title: profileData.metadata?.title,
    description: profileData.metadata?.description,
    images: profileData.metadata?.ogImageUrl ? [profileData.metadata.ogImageUrl] : undefined,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const reqHeaders = await headers();
  const currentPath = reqHeaders.get('x-pathname') || '';
  const isSetupRoute = currentPath.startsWith('/setup');

  const config = getConfig();

  if (!isSetupRoute) {
    if (!config || !config.NEXT_PUBLIC_SUPABASE_URL || !config.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      redirect('/setup');
    }
  } else {
    if (config && config.NEXT_PUBLIC_SUPABASE_URL && config.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      redirect('/');
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ProfileProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ProfileProvider>
      </body>
    </html>
  );
}
