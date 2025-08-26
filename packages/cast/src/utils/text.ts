//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toText(value: any): string {
  if (value == null || value === false) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  } else {
    try { return JSON.stringify(value) } catch { return String(value) };
  }
}
export function lastNonSpaceChar(s: string) {
  for (let i = s.length - 1; i >= 0; i--) {
    const ch = s[i];
    if (!/\s/.test(ch)) return ch;
  }
  return '';
}
export function firstNonSpaceChar(s: string) {
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (!/\s/.test(ch)) return ch;
  }
  return '';
}