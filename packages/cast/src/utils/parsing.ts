import { lastNonSpaceChar, firstNonSpaceChar } from "./text";
export function looksLikeAttrOpen(prev: string) {

  // Find last '<' that starts a tag
  const lastGlyph = prev.lastIndexOf('<');
  if (lastGlyph === -1) return false;
  const afterGlyph = prev.slice(lastGlyph + 1);
  if (afterGlyph.includes('>')) return false;

  // Must end with an attr name (letters, numbers, -, : for SVG/aria)
  // followed by '=' and maybe a quote
  return /[^\s"'>/=]+(?:\s*=\s*["']?)?$/.test(prev);

}
export function looksLikeChildSlot(prev: string, next: string) {
  const last = lastNonSpaceChar(prev);
  const first = firstNonSpaceChar(next || '');

  if (last === '>' && !prev.endsWith('/>')) return true;
  if (first === '<') return true;

  return false;
}