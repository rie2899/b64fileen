import {
  bytesToUtf8,
  decodeBase64ToBytes,
  encodeBytesToBase64,
  normalizeBase64Input,
  utf8ToBytes,
  validateBase64,
  type NormalizeResult,
  type ValidationResult
} from './lib/base64';
import { detectFileType, type FileCategory } from './lib/filetype';
import { extractBase64FilesFromJson, extractBase64FromJsonFragment, type ExtractedB64File } from './lib/json-extract';
import { trackEvent } from './lib/analytics';
import { decodeBase64InWorker, encodeBytesInWorker } from './lib/b64-worker';

const MAX_INPUT_CHARS = 200_000_000; // ~150 MB decoded
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const BIG_FILE_BYTES = 20 * 1024 * 1024;
const BIG_INPUT_CHARS = 400_000; // beyond this size, show a "working on it" hint before starting
const WORKER_DECODE_CHARS = 20_000_000; // ~15 MB decoded — below this the main thread is instant
const SHOW_OUTPUT_LIMIT = 10_000;

const CATEGORY_ICONS: Record<FileCategory | 'unknown', string> = {
  image: '🖼️',
  document: '📄',
  archive: '📦',
  audio: '🎵',
  video: '🎬',
  binary: '⚙️',
  text: '📝',
  unknown: '❓'
};

/** Empty-state sample: a 64x64 checkerboard PNG (terracotta palette) so first-time visitors see a result in one click */
export const SAMPLE_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAa0lEQVR42u3XMQ0AIAxFQZQ0uEIKWnGDgTJ1gXAJYwduevltzZG+iJ6+2+4bAAAAAEAJ8MpHT/cAAAAAADWAEgMAAADYA0oMAAAAYA8oMQAAAIA9oMQAAAAA9oASAwAAANgDSgwAAADwDWAD8bMY8SrLAoYAAAAASUVORK5CYII=';

export function initTool(): void {
  const tool = document.querySelector<HTMLElement>('#tool');
  if (!tool || tool.dataset.initialized === '1') return;
  tool.dataset.initialized = '1';
  const activateMode = initTabs(tool);
  initToFile(tool);
  const handleExternalFile = initToBase64(tool);
  initTextMode(tool);

  // Ctrl+V a screenshot (or any clipboard file) anywhere → straight to encode mode
  document.addEventListener('paste', (e) => {
    const file = e.clipboardData?.files?.[0];
    if (!file) return;
    e.preventDefault();
    activateMode('to-base64');
    trackEvent('tool', 'paste_file', file.type || 'unknown');
    void handleExternalFile(file);
    tool.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

if (typeof document !== 'undefined' && document.querySelector('#tool')) {
  initTool();
}

/* ---------- tabs ---------- */

function initTabs(tool: HTMLElement): (mode: string) => void {
  const tabs = Array.from(tool.querySelectorAll<HTMLButtonElement>('.mode-tab'));
  const panels = Array.from(tool.querySelectorAll<HTMLElement>('.mode-panel'));
  const activate = (mode: string) => {
    tabs.forEach((t) => {
      const active = t.dataset.mode === mode;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
      t.tabIndex = active ? 0 : -1;
    });
    panels.forEach((p) => {
      p.hidden = p.dataset.panel !== mode;
    });
  };
  tabs.forEach((t) =>
    t.addEventListener('click', () => {
      activate(t.dataset.mode ?? 'to-file');
      trackEvent('tool', 'mode_switch', t.dataset.mode ?? '');
    })
  );
  // WAI-ARIA tablist: arrow keys move focus and selection together
  tabs.forEach((t, i) =>
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const next = tabs[(i + dir + tabs.length) % tabs.length];
      next.focus();
      activate(next.dataset.mode ?? 'to-file');
      trackEvent('tool', 'mode_switch', next.dataset.mode ?? '');
    })
  );
  activate(tool.dataset.defaultMode ?? 'to-file');
  return activate;
}

/* ---------- Base64 → file ---------- */

function initToFile(tool: HTMLElement): void {
  const input = tool.querySelector<HTMLTextAreaElement>('#b64-input');
  const diagnosis = tool.querySelector<HTMLElement>('#b64-diagnosis');
  const result = tool.querySelector<HTMLElement>('#b64-result');
  if (!input || !diagnosis || !result) return;

  const loadBtn = tool.querySelector<HTMLButtonElement>('#b64-load-file');
  const fileInput = tool.querySelector<HTMLInputElement>('#b64-file-input');
  const clearBtn = tool.querySelector<HTMLButtonElement>('#b64-clear');
  const sampleBtn = tool.querySelector<HTMLButtonElement>('#b64-sample');
  let timer: number | undefined;
  let runToken = 0;

  const run = () => {
    const token = ++runToken;
    void runOnce(token);
  };

  const runOnce = async (token: number) => {
    const raw = input.value;
    if (!raw.trim()) {
      diagnosis.hidden = true;
      result.hidden = true;
      return;
    }
    if (raw.length > MAX_INPUT_CHARS) {
      diagnosis.hidden = false;
      diagnosis.innerHTML = `<ul class="diag-list"><li class="err">✕ Input is over the ${Math.floor(MAX_INPUT_CHARS / 1_000_000)}M character limit — split it into smaller chunks</li></ul>`;
      result.hidden = true;
      return;
    }

    // JSON API responses with embedded Base64 files — extract instead of decoding
    const trimmedHead = raw.trimStart()[0];
    if (trimmedHead === '[' || trimmedHead === '{') {
      const extracted = extractBase64FilesFromJson(raw);
      if (extracted && extracted.length > 0) {
        diagnosis.hidden = false;
        diagnosis.innerHTML = `<ul class="diag-list">
          <li class="ok">✓ JSON detected — extracted ${extracted.length} Base64 file(s) automatically</li>
          <li class="info">ℹ These are fields from an API response — download them one at a time</li>
        </ul>`;
        renderJsonFilesResult(result, extracted);
        result.hidden = false;
        return;
      }
    }

    // Damaged / partially-copied JSON — recover Base64 runs between punctuation
    if (/["'\[\]{}]/.test(raw)) {
      const recovered = extractBase64FromJsonFragment(raw);
      if (recovered && recovered.length > 0) {
        diagnosis.hidden = false;
        diagnosis.innerHTML = `<ul class="diag-list">
          <li class="ok">✓ Looks like API data (the copy was incomplete) — still recovered ${recovered.length} Base64 file(s)</li>
          <li class="info">ℹ For the original file names, copy the complete API response</li>
        </ul>`;
        renderJsonFilesResult(result, recovered);
        result.hidden = false;
        return;
      }
    }

    if (raw.length > BIG_INPUT_CHARS) {
      diagnosis.hidden = false;
      diagnosis.innerHTML =
        '<ul class="diag-list"><li class="info">ℹ Large input — scanning it first <span class="pixel-loader" aria-hidden="true"></span></li></ul>';
      await new Promise((resolve) => {
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve(null));
        else setTimeout(() => resolve(null), 0);
      });
      if (token !== runToken) return;
    }

    const n = normalizeBase64Input(raw);
    const v = validateBase64(n.normalized);
    renderDiagnosis(diagnosis, n, v);
    diagnosis.hidden = false;

    if (!v.valid) {
      result.hidden = true;
      return;
    }

    try {
      let bytes: Uint8Array;
      if (n.normalized.length > WORKER_DECODE_CHARS) {
        diagnosis.innerHTML +=
          '<ul class="diag-list"><li class="info">ℹ Large payload — decoding in a background thread, the page stays responsive <span class="pixel-loader" aria-hidden="true"></span></li></ul>';
        bytes = await decodeBase64InWorker(n.normalized);
      } else {
        bytes = decodeBase64ToBytes(n.normalized);
      }
      if (token !== runToken) return;
      renderFileResult(result, bytes, n.detectedMimeType);
      result.hidden = false;
    } catch {
      if (token !== runToken) return;
      diagnosis.innerHTML +=
        '<ul class="diag-list"><li class="err">✕ Decode failed — the content looks incomplete. Copy the full data again and retry</li></ul>';
      result.hidden = true;
    }
  };

  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(run, 250);
  });
  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      window.clearTimeout(timer);
      run();
      return;
    }
    if (e.key === 'Escape') {
      window.clearTimeout(timer);
      input.value = '';
      run();
    }
  });

  loadBtn?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (file) {
      input.value = await file.text();
      run();
    }
  });
  clearBtn?.addEventListener('click', () => {
    input.value = '';
    run();
    input.focus();
  });
  sampleBtn?.addEventListener('click', () => {
    input.value = SAMPLE_B64;
    run();
    input.focus();
  });
}

function renderDiagnosis(el: HTMLElement, n: NormalizeResult, v: ValidationResult): void {
  const items: string[] = [];
  n.transformations.forEach((t) => items.push(`<li class="ok">✓ ${escapeHtml(t)}</li>`));
  n.warnings.forEach((w) => items.push(`<li class="warn">⚠ ${escapeHtml(w)}</li>`));
  if (v.valid && !n.transformations.length && !n.warnings.length) {
    items.push('<li class="ok">✓ Clean input — nothing needed fixing</li>');
  }
  v.errors.forEach((e) => items.push(`<li class="err">✕ ${escapeHtml(e)}</li>`));
  if (v.invalidPositions.length > 0) {
    const pos = v.invalidPositions[0];
    const bad = n.normalized[pos] ?? '?';
    const before = n.normalized.slice(Math.max(0, pos - 12), pos);
    const after = n.normalized.slice(pos + 1, pos + 13);
    items.push(
      `<li class="err">↳ invalid character at position ${pos}: 「${escapeHtml(bad)}」 — context:<code class="diag-ctx">${escapeHtml(
        before
      )}<strong>${escapeHtml(bad)}</strong>${escapeHtml(after)}</code></li>`
    );
  }
  if (v.valid) {
    items.push(`<li class="info">ℹ about ${formatBytes(v.estimatedBytes)} after decoding</li>`);
  }
  el.classList.toggle('has-errors', v.errors.length > 0);
  el.innerHTML = `<div class="term-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="term-title">diagnose</span></div><p class="diag-cmd">❯ diagnose --input</p><ul class="diag-list">${items.join('')}</ul>`;
}

function renderFileResult(el: HTMLElement, bytes: Uint8Array, mimeHint: string | null): void {
  const type = detectFileType(bytes);
  const category: FileCategory | 'unknown' = type?.category ?? 'unknown';
  const label = type?.label ?? (mimeHint ? `Unrecognized type (MIME hint: ${mimeHint})` : 'Unrecognized binary file');
  const mime = type?.mime ?? mimeHint ?? 'application/octet-stream';
  const ext = type?.extension ?? mimeHint?.split('/')[1]?.replace(/[^a-z0-9]/gi, '') ?? 'bin';
  const icon = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.unknown;

  el.innerHTML = `
    <div class="file-card">
      <div class="file-icon">${icon}</div>
      <div class="file-meta">
        <strong>${escapeHtml(label)}</strong>
        <span>${escapeHtml(mime)} · ${formatBytes(bytes.length)}</span>
      </div>
      <div class="file-actions">
        <label class="filename-label">File name
          <input class="filename-input" id="dl-name" value="b64file.${escapeHtml(ext)}" />
        </label>
        <button class="btn primary" id="dl-btn" type="button">Download file</button>
      </div>
    </div>
    <div class="preview" id="img-preview" hidden></div>`;

  el.querySelector('#dl-btn')?.addEventListener('click', () => {
    const nameInput = el.querySelector<HTMLInputElement>('#dl-name');
    const name = nameInput?.value.trim() || `b64file.${ext}`;
    trackEvent('tool', 'download_file', mime);
    downloadBytes(bytes, name, mime);
  });

  const preview = el.querySelector<HTMLElement>('#img-preview');
  if (category === 'image' && preview && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    try {
      const blob = new Blob([bytes as unknown as BlobPart], { type: mime });
      const url = URL.createObjectURL(blob);
      preview.innerHTML = `<img src="${url}" alt="Image preview" />`;
      preview.hidden = false;
    } catch {
      /* preview is optional; download still works */
    }
  }
}

function renderJsonFilesResult(el: HTMLElement, files: ExtractedB64File[]): void {
  const cards = files
    .map((file, index) => {
      try {
        const bytes = decodeBase64ToBytes(file.b64);
        const type = detectFileType(bytes);
        const category: FileCategory | 'unknown' = type?.category ?? 'unknown';
        const mime = type?.mime ?? 'application/octet-stream';
        const ext = type?.extension ?? 'bin';
        const icon = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.unknown;
        const baseName = file.label.replace(/\.[a-z0-9]+$/i, '') || `file-${index + 1}`;
        return `
          <div class="file-card" data-file-index="${index}">
            <div class="file-icon">${icon}</div>
            <div class="file-meta">
              <strong>${escapeHtml(file.label)}</strong>
              <span>${escapeHtml(type?.label ?? 'Not recognized')} · ${escapeHtml(mime)} · ${formatBytes(bytes.length)}</span>
            </div>
            <div class="file-actions">
              <label class="filename-label">File name
                <input class="filename-input" value="${escapeHtml(baseName)}.${escapeHtml(ext)}" />
              </label>
              <button class="btn primary dl-json-btn" type="button" data-mime="${escapeHtml(mime)}">Download file</button>
            </div>
          </div>`;
      } catch {
        return `<div class="file-card" data-file-index="${index}"><div class="file-meta"><strong>${escapeHtml(file.label)}</strong><span class="err-inline">✕ Not decoded — check the diagnostics below</span></div></div>`;
      }
    })
    .join('');

  el.innerHTML = `<div class="file-list">${cards}</div>`;

  el.querySelectorAll<HTMLElement>('.file-card[data-file-index]').forEach((card) => {
    const index = Number(card.dataset.fileIndex);
    const btn = card.querySelector<HTMLButtonElement>('.dl-json-btn');
    btn?.addEventListener('click', () => {
      const file = files[index];
      const nameInput = card.querySelector<HTMLInputElement>('.filename-input');
      const name = nameInput?.value.trim() || `file-${index + 1}`;
      try {
        const bytes = decodeBase64ToBytes(file.b64);
        const mime = btn.dataset.mime || 'application/octet-stream';
        trackEvent('tool', 'download_file', 'json-extract');
        downloadBytes(bytes, name, mime);
      } catch {
        /* already flagged as undecodable in the card */
      }
    });
  });
}

/* ---------- file → Base64 ---------- */

function initToBase64(tool: HTMLElement): (file: File) => Promise<void> | void {
  const dropZone = tool.querySelector<HTMLElement>('#drop-zone');
  const fileInput = tool.querySelector<HTMLInputElement>('#file-input');
  const pickBtn = tool.querySelector<HTMLButtonElement>('#pick-file');
  const info = tool.querySelector<HTMLElement>('#file-info');
  const options = tool.querySelector<HTMLElement>('#encode-options');
  const resultEl = tool.querySelector<HTMLElement>('#encode-result');
  if (!dropZone || !fileInput || !info || !options || !resultEl) return () => {};

  let currentFile: File | null = null;
  let currentBytes: Uint8Array | null = null;

  const reset = () => {
    currentFile = null;
    currentBytes = null;
    info.hidden = true;
    options.hidden = true;
    resultEl.hidden = true;
  };

  const handleFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      reset();
      info.hidden = false;
      info.innerHTML = '<p class="err-inline">✕ File is over the 100 MB limit — try a smaller one</p>';
      return;
    }
    if (file.size > BIG_FILE_BYTES) {
      const proceed = window.confirm(
        `This file is ${formatBytes(file.size)}. Converting it takes a lot of browser memory — continue?`
      );
      if (!proceed) return;
    }
    currentFile = file;
    if (file.size > BIG_FILE_BYTES) {
      resultEl.hidden = false;
      resultEl.innerHTML = `<p class="muted">Reading ${formatBytes(
        file.size
      )} — encoding starts when it finishes <span class="pixel-loader" aria-hidden="true"></span></p>`;
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    currentBytes = new Uint8Array(await file.arrayBuffer());
    const type = detectFileType(currentBytes);
    const icon = type ? CATEGORY_ICONS[type.category] : CATEGORY_ICONS.unknown;
    info.hidden = false;
    info.innerHTML = `
      <div class="file-card">
        <div class="file-icon">${icon}</div>
        <div class="file-meta">
          <strong>${escapeHtml(file.name)}</strong>
          <span>${escapeHtml(file.type || type?.mime || 'Unknown type')} · ${formatBytes(file.size)}</span>
        </div>
      </div>`;
    options.hidden = false;
    void encode();
  };

  const encode = async () => {
    if (!currentBytes || !currentFile) return;
    const urlSafe = (tool.querySelector('#opt-urlsafe') as HTMLInputElement)?.checked ?? false;
    const withDataUrl = (tool.querySelector('#opt-dataurl') as HTMLInputElement)?.checked ?? false;
    const wrap76 = (tool.querySelector('#opt-wrap76') as HTMLInputElement)?.checked ?? false;
    const mime = currentFile.type || 'application/octet-stream';
    if (currentBytes.length > BIG_FILE_BYTES) {
      resultEl.hidden = false;
      resultEl.innerHTML = `<p class="muted">Encoding ${formatBytes(
        currentBytes.length
      )} on a background thread — the page stays responsive, results appear automatically <span class="pixel-loader" aria-hidden="true"></span></p>`;
    }
    let out = await encodeBytesInWorker(currentBytes, urlSafe);
    // 76-char line wrapping as used by MIME/PEM. Mutually exclusive with the data: prefix (wrapping would break the URL)
    if (wrap76 && !withDataUrl) out = out.replace(/(.{76})/g, '$1\n').trimEnd();
    if (withDataUrl) out = `data:${mime};base64,${out}`;
    renderEncodeResult(resultEl, out);
    resultEl.hidden = false;
  };

  const dataUrlBox = tool.querySelector<HTMLInputElement>('#opt-dataurl');
  const wrapBox = tool.querySelector<HTMLInputElement>('#opt-wrap76');
  const syncWrapState = () => {
    if (!wrapBox) return;
    if (dataUrlBox?.checked) {
      wrapBox.checked = false;
      wrapBox.disabled = true;
    } else {
      wrapBox.disabled = false;
    }
  };
  dataUrlBox?.addEventListener('change', syncWrapState);

  options.querySelectorAll('input').forEach((i) =>
    i.addEventListener('change', () => {
      syncWrapState();
      void encode();
    })
  );

  ['dragover', 'dragenter'].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add('drag');
    })
  );
  ['dragleave', 'drop'].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag');
    })
  );
  dropZone.addEventListener('drop', (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (file) void handleFile(file);
  });
  dropZone.addEventListener('click', (e) => {
    if (e.target === dropZone || (e.target as HTMLElement).closest('.drop-icon, p')) fileInput.click();
  });
  pickBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) void handleFile(file);
  });

  return handleFile;
}

function renderEncodeResult(el: HTMLElement, out: string): void {
  const canShow = out.length <= SHOW_OUTPUT_LIMIT;
  el.innerHTML = `
    <div class="encode-output">
      ${
        canShow
          ? `<textarea readonly class="mono-out" id="b64-out">${escapeHtml(out)}</textarea>`
          : `<p class="muted">The result is ${out.length.toLocaleString('en-US')} characters — too long to show in full, so copy it or download it.</p>`
      }
      <div class="btn-row">
        <button class="btn" id="copy-btn" type="button">Copy result</button>
        <button class="btn" id="dl-txt-btn" type="button">Download .txt</button>
        <span class="copy-feedback" id="copy-feedback" hidden>Copied ✓</span>
      </div>
    </div>`;

  el.querySelector('#copy-btn')?.addEventListener('click', async () => {
    if (await copyText(out)) {
      trackEvent('tool', 'copy_result', 'encode');
      const fb = el.querySelector<HTMLElement>('#copy-feedback');
      if (fb) {
        fb.hidden = false;
        window.setTimeout(() => {
          fb.hidden = true;
        }, 2000);
      }
    }
  });
  el.querySelector('#dl-txt-btn')?.addEventListener('click', () => {
    downloadText(out, 'b64file-base64.txt');
  });
}

/* ---------- text encode/decode ---------- */

function initTextMode(tool: HTMLElement): void {
  const input = tool.querySelector<HTMLTextAreaElement>('#text-input');
  const output = tool.querySelector<HTMLElement>('#text-output');
  if (!input || !output) return;
  const urlSafeBox = tool.querySelector<HTMLInputElement>('#opt-text-urlsafe');
  const urlSafeWrap = tool.querySelector<HTMLElement>('#text-urlsafe-wrap');

  let timer: number | undefined;

  const run = () => {
    const val = input.value;
    if (!val.trim()) {
      output.hidden = true;
      return;
    }
    const checked = tool.querySelector<HTMLInputElement>('input[name="text-dir"]:checked');
    const dir = checked?.value ?? 'encode';
    let out: string;

    if (dir === 'encode') {
      out = encodeBytesToBase64(utf8ToBytes(val), { urlSafe: urlSafeBox?.checked ?? false });
    } else {
      // check for JWT first: if it is one, lay out the header and payload
      const jwt = val.trim().match(JWT_PATTERN);
      const header = jwt ? decodeJwtPart(jwt[1]) : null;
      const payload = jwt ? decodeJwtPart(jwt[2]) : null;
      if (jwt && header && payload) {
        trackEvent('tool', 'jwt_decode', 'text');
        renderOut(
          `// header\n${header}\n\n// payload\n${payload}`,
          payload,
          '<p class="muted">ℹ JWT detected: the header and payload above are plain text. The third part is the signature — not verified here, and never a credential.</p>'
        );
        return;
      }

      const n = normalizeBase64Input(val);
      const v = validateBase64(n.normalized);
      if (!v.valid) {
        output.hidden = false;
        output.innerHTML = `<p class="err-inline">✕ ${escapeHtml(v.errors[0] ?? 'unable to decode')}</p>`;
        return;
      }
      out = bytesToUtf8(decodeBase64ToBytes(n.normalized));
    }

    renderOut(out, out, '');
  };

  const renderOut = (display: string, copyValue: string, note: string) => {
    output.hidden = false;
    output.innerHTML = `
      ${note}
      <pre class="text-out">${escapeHtml(display)}</pre>
      <div class="btn-row">
        <button class="btn" id="text-copy" type="button">Copy</button>
        <span class="copy-feedback" id="text-fb" hidden>Copied ✓</span>
      </div>`;
    output.querySelector('#text-copy')?.addEventListener('click', async () => {
      if (await copyText(copyValue)) {
        trackEvent('tool', 'copy_result', 'text');
        const fb = output.querySelector<HTMLElement>('#text-fb');
        if (fb) {
          fb.hidden = false;
          window.setTimeout(() => {
            fb.hidden = true;
          }, 2000);
        }
      }
    });
  };

  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(run, 200);
  });
  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      window.clearTimeout(timer);
      run();
      return;
    }
    if (e.key === 'Escape') {
      window.clearTimeout(timer);
      input.value = '';
      run();
    }
  });
  urlSafeBox?.addEventListener('change', run);
  tool.querySelectorAll<HTMLInputElement>('input[name="text-dir"]').forEach((r) =>
    r.addEventListener('change', () => {
      // URL-safe output only matters when encoding: decoding already accepts URL-safe input
      if (urlSafeWrap) urlSafeWrap.hidden = r.value === 'decode';
      run();
    })
  );
}

/** JWT: three Base64URL segments separated by dots. The first two decode to header and payload; the third is a signature, not data */
const JWT_PATTERN = /^([A-Za-z0-9_-]{10,})\.([A-Za-z0-9_-]{10,})\.([A-Za-z0-9_-]*)$/;

function decodeJwtPart(part: string): string | null {
  const n = normalizeBase64Input(part);
  if (!validateBase64(n.normalized).valid) return null;
  try {
    return JSON.stringify(JSON.parse(bytesToUtf8(decodeBase64ToBytes(n.normalized))), null, 2);
  } catch {
    return null;
  }
}

/* ---------- helpers ---------- */

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* clipboard API unavailable or denied */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

function downloadBytes(bytes: Uint8Array, filename: string, mime: string): void {
  const blob = new Blob([bytes as unknown as BlobPart], { type: mime || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function downloadText(text: string, filename: string): void {
  downloadBytes(utf8ToBytes(text), filename, 'text/plain;charset=utf-8');
}
