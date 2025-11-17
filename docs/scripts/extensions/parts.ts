// import type { Token, TokenizerExtension } from 'marked';

// export const addParts: TokenizerExtension = {
//   name: 'part',
//   level: 'block',
//   start(src: string) { return src.match(/{[^{\n]/)?.index; },
//   tokenizer(src: string, tokens: Token[]) {
//       const match = /^{\{([\w-]+)\}\}/.exec(src);
//       if (match) {
//         const token = {
//           type: "part",
//           raw: match[0],
//           key: match[1],
//           text: match[0].trim(),
//           tokens: []
//         };
//         this.lexer.inline(token.text, token.tokens);
//         return token;
//       }
//     },
//   };


  //   customElement(src: string) {
  //   const match = /^<([a-z0-9-]+)([^>]*)\/?>/.exec(src);
  //   if (match) {
  //     return {
  //       type: "customElement",
  //       tag: match[1],
  //       attrs: match[2], //need to parse attributes
  //       raw: match[0],
  //     };
  //   }
  // }
