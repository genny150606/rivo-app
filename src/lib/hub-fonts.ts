import {
  Cinzel,
  DM_Sans,
  Outfit,
  Playfair_Display,
  Space_Grotesk,
  Syne,
} from 'next/font/google';

export const hubCinzel = Cinzel({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-hub-cinzel',
});

export const hubDmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-hub-dm-sans',
});

export const hubOutfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-hub-outfit',
});

export const hubPlayfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-hub-playfair',
});

export const hubSpaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-hub-space-grotesk',
});

export const hubSyne = Syne({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-hub-syne',
});

/**
 * Route-scoped self-hosted font variable classNames for customer Hub and Studio views.
 * Keeping preload=false avoids blocking critical platform routes.
 */
export const HUB_FONT_CLASSES = [
  hubCinzel.variable,
  hubDmSans.variable,
  hubOutfit.variable,
  hubPlayfair.variable,
  hubSpaceGrotesk.variable,
  hubSyne.variable,
].join(' ');
