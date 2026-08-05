// One-off content-sourcing tool: queries Unsplash for a curated list of
// category photos and downloads them into public/photos/. Not used at
// runtime — the prototype must stay network-independent during study
// sessions, so photos are bundled as static local files, not hotlinked.
//
// Usage: node --env-file=.env.local scripts/fetch-unsplash-photos.mjs <manifest.json>
// Manifest: [{ "slug": "hoi-an-old-town", "query": "hoi an old town lanterns night" }, ...]

import { writeFile, mkdir, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!ACCESS_KEY) {
  console.error("Missing UNSPLASH_ACCESS_KEY. Run with: node --env-file=.env.local scripts/fetch-unsplash-photos.mjs <manifest.json>");
  process.exit(1);
}

const manifestPath = process.argv[2];
if (!manifestPath) {
  console.error("Usage: node --env-file=.env.local scripts/fetch-unsplash-photos.mjs <manifest.json>");
  process.exit(1);
}

const manifest = JSON.parse(await import("node:fs/promises").then((fs) => fs.readFile(manifestPath, "utf-8")));

const outDir = path.join(process.cwd(), "public", "photos");
await mkdir(outDir, { recursive: true });
const creditsPath = path.join(outDir, "CREDITS.md");
if (!existsSync(creditsPath)) {
  await writeFile(creditsPath, "# Photo credits (Unsplash)\n\n");
}

let skipped = 0;
for (const { slug, query } of manifest) {
  const filePath = path.join(outDir, `${slug}.jpg`);
  if (existsSync(filePath)) {
    skipped++;
    continue;
  }

  const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
  const res = await fetch(searchUrl, { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } });
  if (!res.ok) {
    console.error(`[${slug}] search failed: ${res.status} ${await res.text()}`);
    if (res.status === 403) {
      console.error("Rate limit hit — stopping this run early, rerun later to pick up the rest.");
      break;
    }
    continue;
  }
  const data = await res.json();
  const photo = data.results?.[0];
  if (!photo) {
    console.error(`[${slug}] no results for query "${query}"`);
    continue;
  }

  const imgRes = await fetch(photo.urls.regular);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  await writeFile(filePath, buf);

  // Unsplash API guideline: ping download_location whenever a photo is used.
  fetch(`${photo.links.download_location}?client_id=${ACCESS_KEY}`).catch(() => {});

  await appendFile(
    creditsPath,
    `- **${slug}.jpg** — Photo by [${photo.user.name}](${photo.user.links.html}?utm_source=ai-travel-planner&utm_medium=referral) on [Unsplash](https://unsplash.com/?utm_source=ai-travel-planner&utm_medium=referral)\n`
  );

  console.log(`[${slug}] saved (${photo.width}x${photo.height}, by ${photo.user.name})`);
}

console.log(`Done. ${skipped} already present, skipped.`);
