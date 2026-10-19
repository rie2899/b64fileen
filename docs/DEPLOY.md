# Deploying the English site

Static site, ~90 kB of JS gzipped, no server-side anything. Any static host works;
Vercel and Cloudflare Pages are both fine (global CDN, free tier is plenty).

## 1. Domain

Use an **own gTLD (.com / .io)**, not a subdomain of someone else's domain and not the
`.cn` domain: Google treats a country TLD as a geo signal, and the Chinese site's ICP
filing requires mainland hosting.

Then edit `site.config.json`:

```json
{
  "siteUrl": "https://yourdomain.com",
  "brand": "b64file",
  "ga4Id": "",
  "zhSiteUrl": "https://b64file.cn"
}
```

`siteUrl` drives canonical, OG tags, sitemap and hreflang — a wrong value here silently
poisons indexing, so verify after deploying (step 5).

## 2. Build locally first

```bash
pnpm install
pnpm test          # 91 tests must pass
pnpm build         # → dist/
```

`pnpm build` runs a prebuild step that writes `public/robots.txt`, `public/sitemap.xml`
and creates the IndexNow key file on first run. Commit that key file.

## 3. Deploy

**Vercel**

```bash
pnpm dlx vercel         # link the project, first deploy is a preview
pnpm dlx vercel --prod  # production
```

`vercel.json` already sets build command, output directory, `cleanUrls`,
`trailingSlash`, the `www → apex` redirect and cache headers. Replace
`REPLACE-WITH-DOMAIN.com` in that file with the real domain before the first production
deploy, otherwise the www redirect points nowhere.

**Cloudflare Pages** — connect the repo, build command `pnpm build`, output `dist`.
Replicate the redirect and headers from `vercel.json` in the CF dashboard (or drop a
`_redirects` / `_headers` file into `public/`).

## 4. Domain + HTTPS

Attach the domain in the host dashboard, point DNS as instructed, wait for the
certificate. Verify: `https://yourdomain.com` loads over HTTPS and
`https://www.yourdomain.com` 301s to the apex.

## 5. Verify what search engines will actually see

```bash
curl -s https://yourdomain.com/ | grep -E 'canonical|hreflang|og:url'
curl -s https://yourdomain.com/sitemap.xml | head -20
curl -s https://yourdomain.com/robots.txt
```

Expect: three `hreflang` links (en / zh-CN / x-default), a canonical on the real domain,
no `REPLACE-WITH-DOMAIN`, and a sitemap with `lastmod` dates.

## 6. Google Search Console

1. Add a **Domain property** (DNS TXT verification covers www, apex and http at once).
2. Submit `https://yourdomain.com/sitemap.xml`.
3. URL Inspection → Request indexing for the home page and the five highest-value pages.
4. After a week, check **Coverage** for excluded pages and **Performance** for the
   queries you actually show up for — that is the real keyword data, better than any guess.

## 7. Bing Webmaster Tools + IndexNow

1. Add the site in Bing Webmaster Tools (you can import straight from GSC).
2. `public/<32-hex>.txt` is the IndexNow key; it is already in the build output.
3. Push every URL whenever content changes:

```bash
bash scripts/indexnow.sh                 # all URLs from dist/sitemap.xml
bash scripts/indexnow.sh https://yourdomain.com/new-page/
```

Behind a proxy? The script defaults to `http://127.0.0.1:7897`; override with
`INDEXNOW_PROXY=` (empty for direct) or `INDEXNOW_ENDPOINT=`. Expect HTTP 200/202.

## 8. Analytics

Create a GA4 property, copy the `G-XXXXXXX` id into `site.config.json` as `ga4Id`,
rebuild, redeploy. The loader only fires on the production host, so previews never
pollute the numbers. Without an id the site sends nothing at all.

## 9. Ads (later, optional)

English tool traffic monetises far better than Chinese traffic, so AdSense is a
reasonable step once there is traffic. Before applying: keep the privacy policy
accurate (it already discloses third-party ad cookies), register the site in AdSense,
and expect a manual review. Do not put ads above the tool — the tool is the page.

## 10. Post-launch loop

- New page → add to `page-registry.json` + `src/static-pages.ts`, bump its `updated`
  date, rebuild, redeploy, then `bash scripts/indexnow.sh <url>`.
- Watch GSC for queries with impressions but no clicks: those are the next page titles.
- Keep `hreflang` paired with the Chinese site — if either URL changes, update both sides.
