import fs from "fs";
import path from "path";

const BASE_URL = "https://openzootcg.com";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateSitemap(): string {
  const urls: Array<{ loc: string; priority: string; changefreq: string }> = [];

  urls.push({ loc: BASE_URL, priority: "1.0", changefreq: "weekly" });
  urls.push({ loc: `${BASE_URL}/create`, priority: "0.9", changefreq: "weekly" });
  urls.push({ loc: `${BASE_URL}/gallery`, priority: "0.8", changefreq: "daily" });
  urls.push({ loc: `${BASE_URL}/about`, priority: "0.5", changefreq: "monthly" });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return xml;
}

const sitemap = generateSitemap();
const outputPath = path.join(process.cwd(), "sitemap.xml");
fs.writeFileSync(outputPath, sitemap, "utf-8");

console.log(`Sitemap generated at ${outputPath}`);
console.log(`Total URLs: ${(sitemap.match(/<url>/g) || []).length}`);
