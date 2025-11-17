// import type { Token, TokenizerAndRendererExtension } from 'marked';


// export const addCustomElements: TokenizerAndRendererExtension = {
//   name: 'customElement',
//   level: 'block',
//   start(src: string) { return src.match(/{[^{\n]/)?.index; },
//   tokenizer(src: string, tokens: Token[]) {

//       const match = /^<([a-z0-9-]+)([^>]*)\/?>/.exec(src);
//       if (match) {
//         return {
//           type: "customElement",
//           tag: match[1],
//           attrs: match[2], //need to parse attributes
//           raw: match[0],
//           //tokens: [] tokens for attributes and attribute lists like classlists
//         };
//       }
//         this.lexer.inline(token.text, token.tokens);
//         return token;
//       }
//     },
//   };
