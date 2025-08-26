import { lastNonSpaceChar, firstNonSpaceChar } from "./text";
export function looksLikeAttrOpen(prev: string) {
  return /([^\s"'>/=]+)\s*(["'])?$/.test(prev);
}
export function looksLikeChildSlot(prev: string, next: string) {
  const last = lastNonSpaceChar(prev);
  const first = firstNonSpaceChar(next || '');
  if (last === '>' || first === '<') return true;
  return false;
}