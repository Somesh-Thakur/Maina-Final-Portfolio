import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Maina — Ambient Music Streaming',
  description: 'Ultra-luxury ambient music streaming platform with high-fidelity audio, immersive visual aesthetics, and reactive design.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,600;1,6..72,300;1,6..72,400&display=swap" rel="stylesheet" />
      </head>
      <body className="font-editorial-sans antialiased bg-[#0a0a0c] text-[#f0f0f0] min-h-screen">
        {children}
      </body>
    </html>
  );
}
