import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { Toaster } from "sonner";
import { UploadProvider } from "@/context/UploadContext";
import UploadQueuePanel from "@/components/upload/UploadQueuePanel";

export const metadata: Metadata = {
  title: "CSCN - Build Real Skills. Work Globally.",
  description: "Learn design, product, and digital skills taught by professionals building real companies around the world.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Outfit:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <SessionProvider>
          <UploadProvider>
            <Toaster
              position="top-center"
              richColors
              toastOptions={{
                duration: 4500,
              }}
            />
            {children}
            <UploadQueuePanel />
          </UploadProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
