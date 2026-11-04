import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const config = JSON.parse(readFileSync('site.config.json', 'utf8'));
const allPages = JSON.parse(readFileSync('page-registry.json', 'utf8'));
const pages = allPages.filter((p) => !p.hide); // hidden pages (404) never enter the sitemap
const siteUrl = config.siteUrl.replace(/\/$/, '');
// lastmod comes from each page's real `updated` field in page-registry.json —
// never the build date: refreshing lastmod on every build gets ignored as untrustworthy.
const today = new Date().toISOString().slice(0, 10); // fallback only

// IndexNow / Bing Webmaster verification needs a key file whose NAME is the key.
// Create one on first build so a fresh deploy is turnkey; keep it stable after that.
const KEY_RE = /^[0-9a-f]{32}\.txt$/;
if (!readdirSync('public').some((f) => KEY_RE.test(f))) {
  const key = randomBytes(16).toString('hex');
  writeFileSync(`public/${key}.txt`, key);
  console.log(`indexnow: created public/${key}.txt`);
}

writeFileSync(
  'public/robots.txt',
  // AI 搜索爬虫显式放行（GEO）：`*` 虽已允许，但显式声明是明确授权信号，
  // 也防止以后加规则误伤。ChatGPT 搜索走 OAI-SearchBot，用户让它开网页走 ChatGPT-User。
  `User-agent: *
Allow: /

# --- AI 搜索与生成式引擎爬虫：显式放行 ---
User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`
);

writeFileSync(
  'public/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .map(
      ({ path, priority, updated }) =>
        `  <url>\n    <loc>${siteUrl}${path}</loc>\n    <lastmod>${updated ?? today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    )
    .join('\n')}\n</urlset>\n`
);

if (!existsSync('dist')) console.log('note: dist/ not built yet — sitemap URLs will be pushed by scripts/indexnow.sh after a build');
