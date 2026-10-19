import { normalizeBase64Input, validateBase64 } from './base64';

export interface ExtractedB64File {
  label: string;
  b64: string;
  valid: boolean;
  estimatedBytes: number;
}

/**
 * Detect JSON API responses that embed Base64 file content and extract
 * every decodable file. Returns null when the text is not JSON at all,
 * and an empty array when it is JSON but contains no Base64 payloads.
 *
 * Real-world shape this handles:
 * [{"fileCode":"TD0101","fileName":"report.pdf","fileContent":"JVBERi...="}, ...]
 */
export function extractBase64FilesFromJson(text: string): ExtractedB64File[] | null {
  let data: unknown;
  try {
    data = JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch {
    return null;
  }
  const files: ExtractedB64File[] = [];
  walk(data, files);
  return files;
}

/**
 * Recover Base64 payloads from a damaged or partially-copied JSON response,
 * e.g. a copy that started in the middle of the first fileContent value:
 *
 *   JVBERi0x...JUVPRgo="},{"fileCode":"TD0204","fileContent":"...",
 *
 * Base64 never contains JSON punctuation, so splitting on those characters
 * cleanly isolates payload runs. Only long, fully-valid runs are kept, so
 * UUIDs, codes and file names fall through.
 */
export function extractBase64FromJsonFragment(text: string): ExtractedB64File[] | null {
  if (!/["'\[\]{}]/.test(text) || !/":|,"|\{/.test(text)) return null;
  const tokens = text.split(/["'\[\]{},:]+/);
  const files: ExtractedB64File[] = [];
  const nameKey = /^(fileName|filename|name|title|fileCode|code)$/i;
  let pendingLabel: string | null = null;
  let awaitingLabelValue = false;
  for (const token of tokens) {
    if (nameKey.test(token)) {
      awaitingLabelValue = true;
      continue;
    }
    if (awaitingLabelValue) {
      if (token.trim()) pendingLabel = token.trim();
      awaitingLabelValue = false;
      continue;
    }
    if (token.length < 100) continue; // real file payloads are far longer than ids/uuids
    const n = normalizeBase64Input(token);
    const v = validateBase64(n.normalized);
    if (v.valid && v.estimatedBytes >= 64) {
      files.push({
        label: pendingLabel ?? `File ${files.length + 1}`,
        b64: n.normalized,
        valid: true,
        estimatedBytes: v.estimatedBytes
      });
      pendingLabel = null;
    }
  }
  return files.length ? files : [];
}

function walk(node: unknown, out: ExtractedB64File[]): void {
  if (Array.isArray(node)) {
    for (const item of node) walk(item, out);
    return;
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && isContentCandidate(key, value)) {
        out.push(makeFile(value, obj));
      } else {
        walk(value, out);
      }
    }
  }
}

function isContentCandidate(key: string, raw: string): boolean {
  if (raw.length < 16) return false; // real payloads survive; the byte-size floor below does the rest
  const k = key.toLowerCase();
  // metadata-ish fields are never payloads
  if (/(code|id|num|type|url|path|status|time|date|version)/.test(k) && !/content|base64/.test(k)) {
    return false;
  }
  if (/content|base64/.test(k)) {
    return isValidBase64Payload(raw);
  }
  // long anonymous strings can still be payloads
  return raw.length >= 500 && isValidBase64Payload(raw);
}

function isValidBase64Payload(raw: string): boolean {
  const n = normalizeBase64Input(raw);
  const v = validateBase64(n.normalized);
  return v.valid && v.estimatedBytes >= 16;
}

function makeFile(raw: string, parent: Record<string, unknown>): ExtractedB64File {
  const n = normalizeBase64Input(raw);
  const v = validateBase64(n.normalized);
  const labelSources = ['fileName', 'filename', 'name', 'title', 'fileCode'];
  let label = '';
  for (const src of labelSources) {
    const val = parent[src];
    if (typeof val === 'string' && val.trim()) {
      label = val.trim();
      break;
    }
  }
  return {
    label: label || 'Untitled file',
    b64: n.normalized,
    valid: v.valid,
    estimatedBytes: v.estimatedBytes
  };
}
