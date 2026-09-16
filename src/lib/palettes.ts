export interface ColorPalette {
  id: string;
  name: string;
  primary: string;
  label: string;
  description: string;
}

export const HUB_COLOR_PRESETS: ColorPalette[] = [
  {
    id: 'lime',
    name: 'Lime Neon',
    primary: '#B4F02A',
    label: 'Lime Neon (Default)',
    description: 'Iconico, dinamico e ad alto contrasto (ispirato allo screenshot)',
  },
  {
    id: 'cyan',
    name: 'Cyber Sky',
    primary: '#00E5FF',
    label: 'Cyber Sky',
    description: 'Moderno, tecnologico e cristallino',
  },
  {
    id: 'amber',
    name: 'Electric Amber',
    primary: '#F59E0B',
    label: 'Oro & Ambra',
    description: 'Caldo, raffinato, perfetto per bistrot e cocktail bar',
  },
  {
    id: 'emerald',
    name: 'Emerald Mint',
    primary: '#10B981',
    label: 'Smeraldo Bio',
    description: 'Fresco, naturale, per locali bio, benessere e farmacie',
  },
  {
    id: 'coral',
    name: 'Sunset Coral',
    primary: '#FF4B6E',
    label: 'Corallo & Rosa',
    description: 'Glamour, fashion, ideale per beauty salon e lounge',
  },
  {
    id: 'violet',
    name: 'Purple Neon',
    primary: '#A855F7',
    label: 'Viola Elettrico',
    description: 'Esclusivo, notturno e premium per club e nightlife',
  },
  {
    id: 'mono',
    name: 'Monochrome Pure',
    primary: '#FFFFFF',
    label: 'Bianco Ottico',
    description: 'Minimalismo assoluto, pulizia estrema in bianco e nero',
  },
];

export const DEFAULT_HUB_COLOR = '#B4F02A';

/**
 * Returns '#000000' or '#FFFFFF' depending on the luminance of the hex color
 */
export function getContrastColor(hexColor: string): '#000000' | '#FFFFFF' {
  if (!hexColor) return '#000000';
  const cleanHex = hexColor.replace('#', '');
  if (cleanHex.length !== 6) return '#000000';
  
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  // YIQ formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#000000' : '#FFFFFF';
}
