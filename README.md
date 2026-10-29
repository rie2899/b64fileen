# b64file (English)

Browser-only Base64 tools — the English edition of [b64file.cn](https://b64file.cn),
live at **[b64file.com](https://b64file.com)** on Vercel.

## What is here

- **29 indexed URLs**: 1 home + 19 conversion/text tools + 6 guide pages + 3 legal pages
- Conversion runs **entirely in the browser**: no backend, no upload, no account
- Pages are generated at build time with per-page title, description, canonical,
  `hreflang` pairs to the Chinese site, JSON-LD (`WebApplication` / `Article` / `FAQPage` / `BreadcrumbList`)
- `dist/llms.txt` is generated for AI search engines (GEO)
- `dist/sitemap.xml` + `dist/robots.txt` come from the prebuild step
- IndexNow key file is created on first build; `scripts/indexnow.sh <url>…` submits new
  pages to Bing/Yandex
- No hosted API on purpose: files never leave the browser, and `/developers/` documents
  the underlying calls instead of exposing an endpoint

## Page types

| Type | Pages | Notes |
| --- | --- | --- |
| Convert to file | `/base64-to-pdf/`, `/base64-to-webp/`, `/base64-to-woff2/`, `/base64-to-svg/`, `/base64-to-mp3/` … | Format is sniffed from magic bytes, never trusted from the extension |
| Text / data | `/base64url/`, `/jwt-decode/`, `/data-url/` | URL-safe alphabet, JWT payload, data URI parsing |
| Encode | `/file-to-base64/`, `/image-to-base64/`, `/pdf-to-base64/` | Local only |
| Guides | `/what-is-base64/`, `/base64-vs-encryption/`, `/how-to-decode-base64-in-javascript/`, `/base64-data-uri-pitfalls/`, `/base64-decode-errors/` | Informational intent, written as citation targets for outreach |
| Developers | `/developers/` | Copy-paste code, magic-byte table, explicit "no hosted API" |

## Commands

```bash
pnpm install
pnpm dev        # local dev server
pnpm test       # 95 tests: engine, DOM interaction, page/link graph, file-type detection
pnpm build      # tsc + vite build → dist/
pnpm preview    # serve the build locally
```

`pnpm test` enforces the internal link graph: every page needs at least 5 inbound links
and may expose at most 5 outbound "related" links, so a new page cannot be silently
orphaned and the footer cannot turn into a link farm.

## Configuration

Everything environment-specific lives in `site.config.json`:

| key | meaning |
| --- | --- |
| `siteUrl` | production origin, no trailing slash. Drives canonical, OG, sitemap, hreflang |
| `brand` | brand name used in the header, footer and JSON-LD |
| `feedbackEmail` | contact address in the footer and legal pages |
| `ga4Id` | GA4 measurement ID (`G-XXXXXXX`). Empty = analytics off |
| `zhSiteUrl` | Chinese site origin for the zh/en `hreflang` pair. Empty = no hreflang |

Change a value there and rebuild — no other file hardcodes the domain or brand.

## Adding a page

1. Add the entry to `src/static-pages.ts`, or `src/guide-pages.ts` for long-form guides
2. Add it to `page-registry.json` (`id`, `path`, `html`, `input`, `priority`, `updated`)
3. Copy an existing `index.html` shell into the new directory and set `data-page="<id>"`
4. `pnpm test` — the link-graph assertions report orphans and over-linked pages
5. `pnpm build && npx vercel --prod --yes`, then
   `scripts/indexnow.sh https://b64file.com/<new-page>/`

## Deployment

`npx vercel --prod --yes` deploys straight from the working tree — GitHub is a backup,
not a deploy target. See `docs/DEPLOY.md` for domain and hosting notes, and
`docs/HANDOFF.md` (Chinese) for the Search Console handoff.

## Page / keyword map

`docs/KEYWORD-MAP.md` records what each page targets, how it maps to the Chinese site,
and which long-tail pages are worth adding next.
