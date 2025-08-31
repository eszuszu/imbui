import { lastNonSpaceChar, firstNonSpaceChar } from "./text";
export function looksLikeAttrOpen(prev: string) {
  // Find the most recent '<'
  const lt = prev.lastIndexOf('<');
  if (lt === -1) return false;

  // If there's a '>' after that '<', we are no longer in a tag-open context
  if (prev.indexOf('>', lt + 1) !== -1) return false;

  // We're inside a tag-open. Grab the tail after '<'
  const tail = prev.slice(lt + 1); // e.g. 'button ', 'button class="x" '

  // CASE A: right after the tag name (minified): `<button${ ... }`
  // tail is just the tag name token (no whitespace yet)
  if (/^[A-Za-z][^\s/>]*$/.test(tail)) return true;

  // CASE B: after tag name/attrs and the last char is whitespace: `<button ${ ... }`
  // or `<button class="x" ${ ... }`
  if (/\s$/.test(prev)) return true;

  // Fallback: original “looks like an attribute being opened” heuristic
  return /[^\s"'>/=]+(?:\s*=\s*["']?)?$/.test(prev);
}
export function looksLikeChildSlot(prev: string, next: string) {
  const last = lastNonSpaceChar(prev);
  const first = firstNonSpaceChar(next || '');

  if (last === '>' && !prev.endsWith('/>')) return true;
  if (first === '<') return true;

  return false;
}