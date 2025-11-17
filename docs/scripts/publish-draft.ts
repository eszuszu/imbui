import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const draftsRoot = path.resolve('content/drafts');
const publishedRoot = path.resolve("content/published");

function walk(dir: string): string[] {
  return fs.readdirSync(dir).flatMap((file) => {
    const full = path.join(dir, file);
    return fs.statSync(full).isDirectory() ? walk(full) : [full];
  });
}

async function publish(file: string) {
  const raw = fs.readFileSync(file, 'utf-8');
  const { data, content } = matter(raw);

  const version = (data.version ?? 0) + 1;
  const updated = new Date().toISOString().slice(0, 10);

  const newData = {
    ...data,
    version,
    updated,
    changelog: [
      ...(data.changelog ?? []),
      { date: updated, note: "Published via script" },
    ],
  };

  const publishedDir = path.join(publishedRoot, data.api);
  if (!fs.existsSync(publishedDir)) fs.mkdirSync(publishedDir, { recursive: true });

  const publishedPath = path.join(publishedDir, `${data.id}.md`);
  const out = matter.stringify(content, newData);

  fs.writeFileSync(publishedPath, out);
  console.log(`Published ${file} => ${publishedPath}`);
}

function main() {
  const files = walk(draftsRoot).filter((f) => f.endsWith(".md"));
  files.forEach(publish);
}

main();



