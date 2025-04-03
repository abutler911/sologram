// client/scripts/generate-sitemap.js
const fs = require("fs");
const path = require("path");

const urls = ["/", "/story-archive", "/stories/123"];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `
  <url>
    <loc>https://sologram.netlify.app${url}</loc>
  </url>`
  )
  .join("")}
</urlset>`;

fs.writeFileSync(path.resolve(__dirname, "../public/sitemap.xml"), sitemap);
