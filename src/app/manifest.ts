import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Maina — Master Audio Streaming',
    short_name: 'Maina',
    description: 'Ultra-luxury ambient music streaming platform with dynamic visuals, synchronized lyrics, and studio fidelity.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0c',
    theme_color: '#0a0a0c',
    icons: [
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
