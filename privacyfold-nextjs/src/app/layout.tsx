import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://privacyfold.com'),
  title: {
    default: 'PrivacyFold — File Tools That Never See Your Files (100% Client-Side)',
    template: '%s | PrivacyFold',
  },
  description:
    '40 client-side image, PDF, form, developer, and cryptography tools running 100% locally in your browser via WebAssembly, WebGPU & WebCrypto. Zero server uploads.',
  alternates: { canonical: 'https://privacyfold.com' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap"
        />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body>{children}</body>
    </html>
  );
}
