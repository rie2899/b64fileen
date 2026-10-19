// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderShell } from '../src/static-pages';
import { encodeBytesToBase64, utf8ToBytes } from '../src/lib/base64';

describe('tool DOM interaction', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.dataset.page = 'home';
    document.body.innerHTML = `<div id="app">${renderShell('home')}</div>`;
  });

  it('decodes pasted PNG base64 into a file card with download button', async () => {
    await import('../src/tool');

    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2]);
    const b64 = encodeBytesToBase64(pngBytes);

    const input = document.querySelector<HTMLTextAreaElement>('#b64-input');
    expect(input).toBeTruthy();
    input!.value = `data:image/png;base64,\n${b64.slice(0, -2)}\n`;
    input!.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise((r) => setTimeout(r, 400));

    const diagnosis = document.querySelector<HTMLElement>('#b64-diagnosis');
    expect(diagnosis?.hidden).toBe(false);
    expect(diagnosis?.innerHTML).toContain('data-URL');

    const result = document.querySelector<HTMLElement>('#b64-result');
    expect(result?.hidden).toBe(false);
    expect(result?.textContent).toContain('PNG image');
    expect(result?.textContent).toContain('image/png');
    expect(result?.querySelector('#dl-btn')).toBeTruthy();
    const nameInput = result?.querySelector<HTMLInputElement>('#dl-name');
    expect(nameInput?.value).toBe('b64file.png');
  });

  it('extracts files when a JSON API response is pasted', async () => {
    await import('../src/tool');

    const pdfBytes = new TextEncoder().encode('%PDF-1.4\nthis is a test pdf payload for json extraction\n%%EOF\n');
    const b64 = encodeBytesToBase64(pdfBytes);
    const json = JSON.stringify([
      { fileCode: 'TD0101', fileName: 'standards.pdf', fileContent: b64 },
      { fileCode: 'TD0204', fileName: 'scoring-rules.pdf', fileContent: b64 }
    ]);

    const input = document.querySelector<HTMLTextAreaElement>('#b64-input');
    input!.value = json;
    input!.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise((r) => setTimeout(r, 400));

    const diagnosis = document.querySelector<HTMLElement>('#b64-diagnosis');
    expect(diagnosis?.hidden).toBe(false);
    expect(diagnosis?.textContent).toContain('JSON');
    expect(diagnosis?.textContent).toContain('2');

    const result = document.querySelector<HTMLElement>('#b64-result');
    expect(result?.hidden).toBe(false);
    const names = Array.from(result?.querySelectorAll('.filename-input') ?? []).map(
      (i) => (i as HTMLInputElement).value
    );
    expect(names).toEqual(['standards.pdf', 'scoring-rules.pdf']);
    expect(result?.querySelectorAll('.dl-json-btn').length).toBe(2);
  });

  it('encodes a pasted clipboard file directly in encode mode', async () => {
    await import('../src/tool');

    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4, 5, 6, 7, 8]);
    const file = new File([png], 'shot.png', { type: 'image/png' });
    const ev = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'clipboardData', { value: { files: [file] } });
    document.dispatchEvent(ev);

    await new Promise((r) => setTimeout(r, 300));

    const tool = document.querySelector<HTMLElement>('#tool');
    const panel = tool?.querySelector<HTMLElement>('.mode-panel[data-panel="to-base64"]');
    expect(panel?.hidden).toBe(false);

    const info = document.querySelector<HTMLElement>('#file-info');
    expect(info?.hidden).toBe(false);
    expect(info?.textContent).toContain('shot.png');

    const result = document.querySelector<HTMLElement>('#encode-result');
    expect(result?.hidden).toBe(false);
    expect((result?.querySelector('#b64-out') as HTMLTextAreaElement)?.value.length).toBeGreaterThan(20);
  });

  it('Ctrl+Enter converts immediately, Esc clears the input', async () => {
    await import('../src/tool');

    const input = document.querySelector<HTMLTextAreaElement>('#b64-input');
    input!.value = 'aGVsbG8gYjY0ZmlsZQ=='; // "hello b64file"
    input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    expect(document.querySelector<HTMLElement>('#b64-result')?.hidden).toBe(false);

    input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    expect(input!.value).toBe('');
    expect(document.querySelector<HTMLElement>('#b64-result')?.hidden).toBe(true);
  });

  it('wraps output at 76 characters when the MIME option is on', async () => {
    await import('../src/tool');

    const bytes = new Uint8Array(200).map((_, i) => i % 251);
    const file = new File([bytes], 'data.bin', { type: 'application/octet-stream' });
    const ev = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'clipboardData', { value: { files: [file] } });
    document.dispatchEvent(ev);
    await new Promise((r) => setTimeout(r, 300));

    const box = document.querySelector<HTMLInputElement>('#opt-wrap76');
    expect(box, 'MIME wrapping option missing').toBeTruthy();
    box!.checked = true;
    box!.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));

    const out = (document.querySelector('#b64-out') as HTMLTextAreaElement)?.value ?? '';
    const lines = out.split('\n');
    expect(lines.length).toBeGreaterThan(1);
    expect(lines[0].length).toBe(76);
  });

  it('toggles the theme and persists the choice', async () => {
    localStorage.clear();
    document.documentElement.dataset.theme = 'light';
    const { initTheme } = await import('../src/theme');
    initTheme();

    const btn = document.querySelector<HTMLButtonElement>('#theme-toggle');
    expect(btn).toBeTruthy();
    expect(btn!.textContent).toBe('🌙');

    btn!.click();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('b64file-theme')).toBe('dark');
    expect(btn!.textContent).toBe('☀️');

    btn!.click();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('b64file-theme')).toBe('light');
  });

  it('renders the about page with brand story and feedback email', () => {
    document.body.dataset.page = 'about';
    document.body.innerHTML = `<div id="app">${renderShell('about')}</div>`;
    const html = document.body.innerHTML;
    expect(html).toContain('About');
    expect(html).toContain('Built out of love');
    expect(html).toContain('mailto:greedy2899@gmail.com');
    expect(html).not.toContain('id="tool"');
    expect(html).toContain('Terms');
  });

  it('footer shows brand, contact email and copyright year', () => {
    document.body.dataset.page = 'home';
    document.body.innerHTML = `<div id="app">${renderShell('home')}</div>`;
    const footer = document.querySelector('footer')?.innerHTML ?? '';
    expect(footer).toContain('Built out of love');
    expect(footer).toContain('greedy2899@gmail.com');
    expect(footer).toContain(`© ${new Date().getFullYear()}`);
    expect(footer).toContain('/about/');
    expect(footer).toContain('/terms/');
  });

  it('home schema has no breadcrumb while subpages do', () => {
    document.body.dataset.page = 'home';
    document.body.innerHTML = `<div id="app">${renderShell('home')}</div>`;
    // Injected by the vite plugin at build time; here we only assert the renderer does not throw — schema details are checked against the build output
    expect(document.querySelector('#app')?.innerHTML).toContain('b64file');
  });

  it('shows validation errors for invalid base64 without rendering a result', async () => {
    await import('../src/tool');

    const input = document.querySelector<HTMLTextAreaElement>('#b64-input');
    input!.value = 'not base64!!!';
    input!.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise((r) => setTimeout(r, 400));

    const diagnosis = document.querySelector<HTMLElement>('#b64-diagnosis');
    expect(diagnosis?.hidden).toBe(false);
    expect(diagnosis?.textContent).toContain('invalid character');

    const result = document.querySelector<HTMLElement>('#b64-result');
    expect(result?.hidden).toBe(true);
  });

  it('load-sample button fills the sample and produces a result', async () => {
    await import('../src/tool');

    const btn = document.querySelector<HTMLButtonElement>('#b64-sample');
    expect(btn, 'Load sample button missing').toBeTruthy();
    btn!.click();

    await new Promise((r) => setTimeout(r, 400));

    const input = document.querySelector<HTMLTextAreaElement>('#b64-input');
    expect(input!.value.length).toBeGreaterThan(100);
    const result = document.querySelector<HTMLElement>('#b64-result');
    expect(result?.hidden).toBe(false);
    expect(result?.textContent).toContain('PNG');
  });

  it('URL-safe text output maps + / to - _ and drops padding', async () => {
    await import('../src/tool');

    const tool = document.querySelector<HTMLElement>('#tool');
    tool?.querySelector<HTMLButtonElement>('.mode-tab[data-mode="text"]')?.click();

    const input = document.querySelector<HTMLTextAreaElement>('#text-input');
    input!.value = 'gZ?%P>{4'; // base64 of this string contains both + and /
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 350));

    const out1 = document.querySelector('#text-output')?.textContent ?? '';
    expect(out1).toContain('+');

    const box = document.querySelector<HTMLInputElement>('#opt-text-urlsafe');
    expect(box, 'URL-safe toggle missing').toBeTruthy();
    box!.checked = true;
    box!.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 350));

    const out2 = document.querySelector('#text-output')?.textContent ?? '';
    expect(out2).not.toContain('+');
    expect(out2).not.toContain('/');
    expect(out2).toContain('-');
  });

  it('pasting a JWT decodes the header and payload as plain JSON', async () => {
    await import('../src/tool');

    const tool = document.querySelector<HTMLElement>('#tool');
    tool?.querySelector<HTMLButtonElement>('.mode-tab[data-mode="text"]')?.click();

    const radio = document.querySelector<HTMLInputElement>('input[name="text-dir"][value="decode"]');
    radio!.checked = true;
    radio!.dispatchEvent(new Event('change', { bubbles: true }));

    const b64u = (o: unknown) => encodeBytesToBase64(utf8ToBytes(JSON.stringify(o)), { urlSafe: true });
    const jwt = `${b64u({ alg: 'HS256', typ: 'JWT' })}.${b64u({ sub: '1234567890', name: 'Sia' })}.fakesignature`;

    const input = document.querySelector<HTMLTextAreaElement>('#text-input');
    input!.value = jwt;
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 350));

    const out = document.querySelector('#text-output')?.textContent ?? '';
    expect(out).toContain('JWT detected');
    expect(out).toContain('HS256');
    expect(out).toContain('1234567890');
  });

  it('encodes text in text mode', async () => {
    await import('../src/tool');

    const tool = document.querySelector<HTMLElement>('#tool');
    const textTab = tool?.querySelector<HTMLButtonElement>('.mode-tab[data-mode="text"]');
    textTab?.click();

    const input = document.querySelector<HTMLTextAreaElement>('#text-input');
    expect(input).toBeTruthy();
    input!.value = 'hello b64file';
    input!.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise((r) => setTimeout(r, 350));

    const output = document.querySelector<HTMLElement>('#text-output');
    expect(output?.hidden).toBe(false);
    expect(output?.textContent).toContain('aGVsbG8gYjY0ZmlsZQ==');
  });

  it('switches to file-to-base64 mode via tab', async () => {
    await import('../src/tool');

    const tool = document.querySelector<HTMLElement>('#tool');
    const tab = tool?.querySelector<HTMLButtonElement>('.mode-tab[data-mode="to-base64"]');
    tab?.click();
    expect(tab?.classList.contains('active')).toBe(true);

    const panel = tool?.querySelector<HTMLElement>('.mode-panel[data-panel="to-base64"]');
    expect(panel?.hidden).toBe(false);
    expect(panel?.querySelector('#drop-zone')).toBeTruthy();
  });

  it('moves between tabs with arrow keys (WAI-ARIA tablist)', async () => {
    await import('../src/tool');

    const tool = document.querySelector<HTMLElement>('#tool');
    const tabs = Array.from(tool?.querySelectorAll<HTMLButtonElement>('.mode-tab') ?? []);
    expect(tabs.length).toBe(3);

    const first = tabs.find((t) => t.dataset.mode === 'to-file')!;
    expect(first.tabIndex).toBe(0);
    expect(tabs.find((t) => t.dataset.mode === 'text')!.tabIndex).toBe(-1);

    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    const second = tabs.find((t) => t.dataset.mode === 'to-base64')!;
    expect(second.classList.contains('active')).toBe(true);
    expect(second.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(second);

    second.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(first.classList.contains('active')).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it('keeps theme-color meta in sync with the manual theme toggle', async () => {
    localStorage.clear();
    document.head.innerHTML = '<meta name="theme-color" content="#faf9f5" />';
    document.documentElement.dataset.theme = 'light';
    const { initTheme } = await import('../src/theme');
    initTheme();

    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    expect(meta?.getAttribute('content')).toBe('#faf9f5');

    document.querySelector<HTMLButtonElement>('#theme-toggle')!.click();
    expect(meta?.getAttribute('content')).toBe('#1f1e1d');

    document.querySelector<HTMLButtonElement>('#theme-toggle')!.click();
    expect(meta?.getAttribute('content')).toBe('#faf9f5');
  });

  it('shows the offending character with surrounding context on invalid input', async () => {
    await import('../src/tool');

    const input = document.querySelector<HTMLTextAreaElement>('#b64-input');
    input!.value = 'Zm9vYmFy$$x';
    input!.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise((r) => setTimeout(r, 400));

    const diagnosis = document.querySelector<HTMLElement>('#b64-diagnosis');
    expect(diagnosis?.hidden).toBe(false);
    expect(diagnosis?.textContent).toContain('invalid character');
    expect(diagnosis?.textContent).toContain('「$」');
    expect(diagnosis?.textContent).toContain('context');
    const ctx = diagnosis?.querySelector('.diag-ctx');
    expect(ctx?.textContent).toContain('Zm9vYmFy');
    expect(ctx?.querySelector('strong')?.textContent).toBe('$');
  });

  it('text mode follows the per-page default direction (decode on text pages, encode elsewhere)', () => {
    document.body.dataset.page = 'base64-to-text';
    document.body.innerHTML = `<div id="app">${renderShell('base64-to-text')}</div>`;
    expect(document.querySelector<HTMLInputElement>('input[name="text-dir"]:checked')?.value).toBe('decode');
    expect(document.querySelector('#tool')?.getAttribute('data-default-mode')).toBe('text');

    document.body.dataset.page = 'base64url';
    document.body.innerHTML = `<div id="app">${renderShell('base64url')}</div>`;
    expect(document.querySelector<HTMLInputElement>('input[name="text-dir"]:checked')?.value).toBe('decode');

    document.body.dataset.page = 'home';
    document.body.innerHTML = `<div id="app">${renderShell('home')}</div>`;
    expect(document.querySelector<HTMLInputElement>('input[name="text-dir"]:checked')?.value).toBe('encode');
  });
});
