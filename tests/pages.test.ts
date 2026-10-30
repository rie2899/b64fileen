import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import registry from '../page-registry.json';
import { canonicalTag, metaTags, pageData, renderShell } from '../src/static-pages';

const root = process.cwd();
const pages = registry as Array<{
  id: string;
  path: string;
  html: string;
  input: string;
  priority: string;
  hide?: boolean;
}>;

// Hidden pages (404) have no content sections and no canonical, so consistency checks only cover public content pages
const contentPages = pages.filter((page) => !page.hide);

describe('page registry consistency', () => {
  it('every registry page has complete pageData', () => {
    for (const p of pages) {
      const d = pageData[p.id];
      expect(d, `missing pageData: ${p.id}`).toBeTruthy();
      for (const k of ['title', 'desc', 'h1', 'answer'] as const) {
        expect(d[k] && d[k].length, `${p.id}.${k} is empty`).toBeGreaterThan(0);
      }
      if (!p.hide) {
        expect(d.sections.length, `${p.id} has no sections`).toBeGreaterThan(0);
        expect(d.faqs.length, `${p.id} has no faqs`).toBeGreaterThan(0);
      }
    }
  });

  it('every registry page has a physical HTML shell whose data-page matches its id', () => {
    for (const p of pages) {
      const f = resolve(root, p.html);
      expect(existsSync(f), `missing shell file: ${p.html}`).toBe(true);
      expect(readFileSync(f, 'utf8'), `${p.html} should carry data-page="${p.id}"`).toContain(
        `data-page="${p.id}"`
      );
    }
  });

  it('every page renders a title, description and canonical without leaking undefined', () => {
    for (const p of pages) {
      const shell = renderShell(p.id);
      expect(shell, `${p.id} rendered no h1`).toContain('<h1>');
      expect(shell, `${p.id} rendered undefined`).not.toContain('undefined');
      expect(metaTags(p.id), `${p.id} missing title`).toContain('<title>');
      expect(metaTags(p.id), `${p.id} missing description`).toContain('name="description"');
      if (!p.hide) {
        expect(canonicalTag(p.id), `${p.id} missing canonical`).toContain('rel="canonical"');
      }
    }
  });

  it('public page count matches the registry (hidden pages excluded)', () => {
    expect(contentPages.length).toBe(pages.length - 1);
    expect(contentPages.length).toBeGreaterThanOrEqual(14);
  });

  it('both main inputs carry an aria-label (screen reader support)', () => {
    const shell = renderShell('home');
    expect(shell).toContain('aria-label="Paste Base64 or file data"');
    expect(shell).toContain('aria-label="Enter text or Base64"');
  });

  it('IndexNow key file exists and is well formed (Bing instant indexing relies on it)', () => {
    // Other .txt files (robots.txt and friends) also live in public/, and a loose
    // [A-Za-z0-9-] pattern would match them — so match the 32-hex shape this project generates.
    const keys = readdirSync(resolve(root, 'public')).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
    expect(keys.length, 'public/ should contain at least one <key>.txt').toBeGreaterThanOrEqual(1);
    for (const f of keys) {
      const name = f.replace(/\.txt$/, '');
      const content = readFileSync(resolve(root, 'public', f), 'utf8').trim();
      // Several keys are legitimate (a host may publish more than one while rotating),
      // but each must be self-consistent or Bing rejects the check.
      expect(content, 'the key file content must equal its file name or Bing rejects the check').toBe(name);
    }
  });

  it('link graph: every page has ≤5 outgoing and ≥5 incoming internal links', () => {
    const pathToId = new Map(contentPages.map((p) => [p.path, p.id]));
    const outbound = new Map<string, string[]>();

    for (const p of contentPages) {
      const shell = renderShell(p.id);
      const start = shell.indexOf('Related tools and guides');
      const end = shell.indexOf('</section>', start);
      const seg = shell.slice(start, end > start ? end : undefined);
      const hrefs = [...seg.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      outbound.set(p.id, hrefs);
    }

    for (const [id, hrefs] of outbound) {
      expect(hrefs.length, `${id} has no related links`).toBeGreaterThan(0);
      expect(hrefs.length, `${id} has more than 5 related links (looks like a link farm)`).toBeLessThanOrEqual(5);
      expect(new Set(hrefs).size, `${id} has duplicate related links`).toBe(hrefs.length);
    }

    const inbound = new Map<string, number>();
    for (const hrefs of outbound.values()) {
      for (const h of hrefs) {
        const id = pathToId.get(h);
        if (id) inbound.set(id, (inbound.get(id) ?? 0) + 1);
      }
    }

    for (const p of contentPages) {
      const n = inbound.get(p.id) ?? 0;
      expect(n, `${p.id} is linked by only ${n} pages, expected ≥5`).toBeGreaterThanOrEqual(5);
    }
  });

  it('pages with quick facts render the above-the-fold list, others do not', () => {
    const shell = renderShell('base64-decode-errors');
    expect(shell).toContain('class="quick-list"');
    expect(shell.split('<li>').length - 1).toBeGreaterThanOrEqual(5);
    expect(renderShell('privacy')).not.toContain('class="quick-list"');
  });

  it('the current page is highlighted in the nav (active + aria-current) and no other page is', () => {
    const shell = renderShell('base64-to-file');
    expect(shell).toContain('href="/base64-to-file/" class="active" aria-current="page"');
    expect(shell.split('aria-current="page"').length - 1, 'exactly one page should be current').toBe(1);
    expect(renderShell('home')).not.toContain('aria-current="page"');
  });

  it('every page has a real updated date (sitemap lastmod; never refreshed on each build)', () => {
    for (const p of pages) {
      expect((p as { updated?: string }).updated, `missing updated: ${p.id}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('pageData has no orphan keys and mode values are valid', () => {
    const ids = new Set(pages.map((p) => p.id));
    for (const key of Object.keys(pageData)) {
      expect(ids.has(key), `pageData key ${key} is not in the registry`).toBe(true);
    }
    for (const p of pages) {
      expect(['to-file', 'to-base64', 'text']).toContain(pageData[p.id].mode);
    }
  });
});
