import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://privacyfold.com'),
  title: {
    default: 'PrivacyFold — File Tools That Never See Your Files (100% Client-Side)',
    template: '%s | PrivacyFold',
  },
  description:
    '72 client-side image, PDF, form, developer, and cryptography tools running 100% locally in your browser via WebAssembly, WebGPU & WebCrypto. Zero server uploads.',
  alternates: { canonical: 'https://privacyfold.com' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/fonts/fonts.css" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body>{children}</body>
    </html>
  );
}
