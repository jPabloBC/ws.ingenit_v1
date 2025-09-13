import type { Metadata } from "next";
import { Archivo, Sansation } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ErrorHandler from "@/components/ErrorHandler";
import ConditionalProviders from "@/components/ConditionalProviders";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const sansation = Sansation({
  subsets: ["latin"],
  variable: "--font-sansation",
  weight: ["300", "400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ingenit Store Manager",
  description: "La solución completa para gestionar tu negocio",
  icons: {
    icon: [
      {
        url: "/assets/icon_ingenIT.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/assets/icon_ingenIT.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/assets/icon_ingenIT.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/assets/icon_ingenIT.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${archivo.variable} ${sansation.variable}`}>
      <head>
        {/* Favicon configuration for maximum browser compatibility */}
        <link rel="icon" href="/assets/icon_ingenIT.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/assets/icon_ingenIT.png" type="image/png" sizes="16x16" />
        <link rel="shortcut icon" href="/assets/icon_ingenIT.png" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/icon_ingenIT.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/icon_ingenIT.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/assets/icon_ingenIT.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/assets/icon_ingenIT.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/assets/icon_ingenIT.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/assets/icon_ingenIT.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/assets/icon_ingenIT.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/assets/icon_ingenIT.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/assets/icon_ingenIT.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/assets/icon_ingenIT.png" />
        {/* Windows Tile icons */}
        <meta name="msapplication-TileColor" content="#001a33" />
        <meta name="msapplication-TileImage" content="/assets/icon_ingenIT.png" />
        {/* Android Chrome */}
        <link rel="icon" type="image/png" sizes="192x192" href="/assets/icon_ingenIT.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/assets/icon_ingenIT.png" />
      </head>
      <body className="font-body antialiased bg-gray10 text-blue1">
        <ErrorHandler />
        <ConditionalProviders>
          {children}
        </ConditionalProviders>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#cce4ff',
              color: '#001a33',
              border: '1px solid #0078ff',
            },
            success: {
              iconTheme: {
                primary: '#0078ff',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#dc2626',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}