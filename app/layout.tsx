import type { Metadata } from 'next';
import { Archivo, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Pixel Brawl 2.5D - Retro Sprite-Stacking Platform Fighter',
  description:
    'A browser-based 2.5D retro platform fighter with a Web Worker sprite-stacking renderer, classic multi-frame indexed pixel-chart fighters, smooth 4-angle camera, Pixel Forge editor, and PNG sprite-sheet importer.',
  openGraph: {
    title: 'Pixel Brawl 2.5D - Retro Sprite-Stacking Platform Fighter',
    description:
      'Browser-based 2.5D retro platform fighter with OffscreenCanvas Web Worker rendering, multi-frame indexed pixel charts, and Smash-style combat.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pixel Brawl 2.5D - Retro Sprite-Stacking Platform Fighter',
    description:
      'Browser-based 2.5D retro platform fighter with OffscreenCanvas Web Worker rendering, multi-frame indexed pixel charts, and Smash-style combat.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} ${dmSans.variable} ${jetbrainsMono.variable} dark`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#0B1020] text-[#F1F5F9] font-sans antialiased selection:bg-[#F59E0B]/30 selection:text-white overflow-x-hidden"
      >
        {children}
      </body>
    </html>
  );
}
