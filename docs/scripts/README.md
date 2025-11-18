## Notes for extending marked
Note: any frontmatter or YAML/TOML formatting needs to be parsed separate,
fencing (`---`) will just be rendered as breaks

### General usage
```ts
import { marked } from 'marked';

marked.use({ 
  { options } //the marked options object the extension implements
});

interface MarkedOptions {
  async?: boolean = false;
  breaks?: boolean = false;
  gfm?: boolean = false;
  pedantic?: boolean = false;
  renderer?: Renderer = new Renderer();
  silent?: boolean = false;
  tokenizer?: object = new Tokenizer();
  walkTokens?: () => void;
}
```

**All options overwrite the previously set ones, but `renderer`, `tokenizer`, `hooks`, `walkTokens`, and `extensions`.**


input string (generally markdown) -> `Lexer` creates segments, `tokenizer` tokenizeses segments using pattern matching, begins bookkeeping info like type, whether it's block or inline, child tokens-> `walkTokens` then can traverse the tokens tree to post-process token contents! -> the `parser` traverses the token tree and sends the tokens into a `renderer` for that token. 

## To create a new page Docs page:

  - run `create-draft.ts` and answer the prompts
  - author the file created in `published`
  - run `publish-draft.ts` to create the publishable file
  - run `compile-md.ts` to parse and transform the markdown into html or templates 
