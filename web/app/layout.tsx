import type { Metadata, Viewport } from 'next';
import { DM_Sans, Manrope } from 'next/font/google';
import type { ReactNode } from 'react';
import SoundToggle from '../components/SoundToggle';
import CustomCursor from '../components/CustomCursor';
import '../styles/global.css';
const body=DM_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const display=Manrope({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
export const viewport: Viewport={ themeColor: '#101c15', width: 'device-width', initialScale: 1 };
export const metadata: Metadata={ metadataBase: new URL('https://cropbillai.me'), title: 'CropBillAI: Grow more. Guess less.', description: 'An app we’re building for small farmers in India. Snap a farm bill, file it under crop and season, and see profit per crop. Join the early-access waitlist.', alternates: { canonical: '/' }, openGraph: { type: 'website', url: '/', siteName: 'CropBillAI', locale: 'en_IN', images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Wheat, rice and cotton plots at twilight' }] }, twitter: { card: 'summary_large_image', images: ['/og-image.jpg'] }, icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' },{ url: '/favicon.ico', sizes: '32x32' }], apple: '/apple-touch-icon.png' }, robots: { index: true, follow: true } };
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en-IN" className={`${body.variable} ${display.variable}`} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}/></head><body><a className="skip-link" href="#main">Skip to content</a>{children}<SoundToggle/><CustomCursor/></body></html>;
}
