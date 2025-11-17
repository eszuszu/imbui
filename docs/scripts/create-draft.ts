import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function formatDate(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function createId(slug: string, created: string): string {
  return `${created}-${slug}`;
}

function ask(q: string): Promise<string> {
  return new Promise((resolve) => rl.question(q, resolve));
}

async function main() {
  const title = await ask('Title of the document: ');
  const tag = await ask('Tag to use as the root page element: ');
  const api = await ask('What API or Collection does this reference?: ');
  const created = formatDate(new Date());
  const slug = title.toLowerCase()
    .replace(/[^\w]+/g, "-")
    .replace(/^-|-$/g, "");

  const id = createId(slug, created);

  const blueprint = path.resolve(`content/blueprints/blueprint.md`);
  const outputDir = path.resolve(`content/drafts/${api}`);
  const outputPath = path.join(outputDir, `${id}.md`);

  const template = fs.readFileSync(blueprint, 'utf-8');

  const filled = template
    .replace(/title:\s*".*"/, `title: "${title}"`)
    .replace(/tag:\s*".*"/, `tag: "${tag}"`)
    .replace(/api:\s*".*"/, `api: "${api}"`)
    .replace(/created:\s*".*"/, `created: "${created}"`)
    .replace(/slug:\s*".*"/, `slug: "${slug}"`)
    .replace(/id:\s*".*"/, `id: "${id}"`);

    //if the directory doesn't exist, create it and return it
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(outputPath, filled);
  console.log(`Created ${outputPath}`);
  rl.close();
}

main();