import  fs  from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const publishedRoot = path.resolve("content/published");
const pageTokensRoot = path.resolve("public/json");
const pageHtmlRoot = path.resolve("content/html")

function walk(dir: string): string[] {
  return fs.readdirSync(dir).flatMap((file) => {
    const full = path.join(dir, file);
    return fs.statSync(full).isDirectory() ? walk(full) : [full];
  });
}

async function compile(file: string) {
  const raw = fs.readFileSync(file, 'utf-8');

  const { content, data } = matter(raw);
  const tokens = marked.lexer(content);
  const html = marked.parser(tokens);
  
  const page = {
    meta: data,
    tokens,
  };
   
  const jsonDir = path.join(pageTokensRoot, data.api);
  if (!fs.existsSync(jsonDir)) fs.mkdirSync(jsonDir, { recursive: true });

  const jsonPath = path.join(jsonDir, `${data.slug}.json`);

  fs.writeFileSync(jsonPath, JSON.stringify(page, null, 2));

  const htmlDir = path.join(pageHtmlRoot, data.api);
  if (!fs.existsSync(htmlDir)) fs.mkdirSync(htmlDir, { recursive: true });

  const htmlPath = path.join(htmlDir, `${data.slug}.html`);

  fs.writeFileSync(htmlPath, html);
}

function main() {
  const files = walk(publishedRoot).filter((f) => f.endsWith(".md"));
  files.forEach(compile);
}

main();