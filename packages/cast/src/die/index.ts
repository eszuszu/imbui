import type { TemplateResult } from "../types";
const html = (
  strings: TemplateStringsArray,
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...values: any[]
): TemplateResult => {
  return { identity: strings, values, strings, }
};
export { html, html as die }