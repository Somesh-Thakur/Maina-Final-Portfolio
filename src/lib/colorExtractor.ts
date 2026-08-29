import { FastAverageColor } from 'fast-average-color';

const fac = new FastAverageColor();
const colorCache = new Map<string, { primary: string; secondary: string }>();

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;
  h /= 360;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export async function extractColors(imageUrl: string): Promise<{ primary: string; secondary: string }> {
  if (colorCache.has(imageUrl)) {
    const colors = colorCache.get(imageUrl)!;
    setCssVars(colors.primary, colors.secondary);
    return colors;
  }

  try {
    const color = await fac.getColorAsync(imageUrl);
    const [r, g, b] = color.value;
    
    // Primary color
    const primary = `rgb(${r}, ${g}, ${b})`;
    
    // Secondary color (hue shifted by 30 degrees)
    let [h, s, l] = rgbToHsl(r, g, b);
    h = (h + 30) % 360;
    const [r2, g2, b2] = hslToRgb(h, s, l);
    const secondary = `rgb(${r2}, ${g2}, ${b2})`;

    const colors = { primary, secondary };
    colorCache.set(imageUrl, colors);
    
    setCssVars(primary, secondary);
    return colors;
  } catch (error) {
    console.error('Failed to extract color:', error);
    const defaultColors = { primary: '#2563eb', secondary: '#7c3aed' };
    setCssVars(defaultColors.primary, defaultColors.secondary);
    return defaultColors;
  }
}

function setCssVars(primary: string, secondary: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--ambient-primary', primary);
    document.documentElement.style.setProperty('--ambient-secondary', secondary);
  }
}
