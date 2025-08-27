//eslint-disable-next-line @typescript-eslint/no-explicit-any
type Replacer = (value: any, key?: string | number) => string | undefined;

export function toText(value: unknown, replacer?: Replacer): string {
  if (value == null) return '';
  if (replacer) {
    const replaced = replacer(value)
    if (replaced !== undefined) return replaced;
  }

  const type = typeof value;

  if (type === 'string' || type === 'number' || type === 'boolean') {
    return String(value)
  }
  if (type === 'function' || type === 'symbol') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    try {
      return `[${value.map((v,) => toText(v, replacer)).join(',')}]`;
    } catch (err) {
      console.error("toText: failed to stringify array", err);
      return String(value);
    }
  }

  try {
    return JSON.stringify(value, (_key, val) => {
      if (replacer) {
        const r = replacer(val, _key);
        if (r!== undefined) return r;
      }
      if (typeof val === 'function' || typeof val === 'symbol') {
        return val.toString();
      }
      return val
    });
  } catch (e) {
    console.error('toText: failed to stringify', e);
    return String(value);
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