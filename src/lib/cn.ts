/**
 * Lightweight zero-dependency className joiner for RIVO UI primitives.
 */
export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(' ');
}
