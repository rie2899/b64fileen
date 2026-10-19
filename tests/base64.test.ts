import { describe, expect, it } from 'vitest';
import {
  bytesToUtf8,
  decodeBase64ToBytes,
  encodeBytesToBase64,
  normalizeBase64Input,
  utf8ToBytes,
  validateBase64
} from '../src/lib/base64';
import { detectFileType } from '../src/lib/filetype';

describe('RFC 4648 test vectors', () => {
  const vectors: Array<[string, string]> = [
    ['', ''],
    ['f', 'Zg=='],
    ['fo', 'Zm8='],
    ['foo', 'Zm9v'],
    ['foob', 'Zm9vYg=='],
    ['fooba', 'Zm9vYmE='],
    ['foobar', 'Zm9vYmFy']
  ];

  it.each(vectors)('encodes %j -> %j', (input, expected) => {
    expect(encodeBytesToBase64(utf8ToBytes(input))).toBe(expected);
  });

  it.each(vectors.filter(([input]) => input.length > 0))('decodes %j -> %j', (expected, b64) => {
    expect(bytesToUtf8(decodeBase64ToBytes(b64))).toBe(expected);
  });
});

describe('binary round trip', () => {
  it('round trips every length from 0 to 64', () => {
    for (let len = 0; len <= 64; len++) {
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = (i * 37 + len * 11) & 0xff;
      const rt = decodeBase64ToBytes(encodeBytesToBase64(bytes));
      expect(Array.from(rt)).toEqual(Array.from(bytes));
    }
  });

  it('round trips a 256 KB binary payload', () => {
    const bytes = new Uint8Array(256 * 1024);
    let seed = 42;
    for (let i = 0; i < bytes.length; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      bytes[i] = (seed >>> 16) & 0xff;
    }
    const rt = decodeBase64ToBytes(encodeBytesToBase64(bytes));
    expect(rt.length).toBe(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      if (rt[i] !== bytes[i]) {
        throw new Error(`byte mismatch at ${i}: ${rt[i]} !== ${bytes[i]}`);
      }
    }
  });

  it('round trips UTF-8 text including Chinese and emoji', () => {
    const text = 'Hello, world! Base64 file conversion test émoji 🎉';
    expect(bytesToUtf8(decodeBase64ToBytes(encodeBytesToBase64(utf8ToBytes(text))))).toBe(text);
  });
});

describe('url-safe encoding', () => {
  it('outputs url-safe alphabet without padding', () => {
    const bytes = new Uint8Array([0xfb, 0xff, 0xbf]);
    const std = encodeBytesToBase64(bytes);
    expect(std).toMatch(/[+/]/);
    const url = encodeBytesToBase64(bytes, { urlSafe: true });
    expect(url).not.toMatch(/[+/=]/);
  });
});

describe('normalizeBase64Input', () => {
  it('strips data URL prefix and detects MIME', () => {
    const r = normalizeBase64Input('data:image/png;base64,iVBORw0KGgo=');
    expect(r.normalized).toBe('iVBORw0KGgo=');
    expect(r.detectedMimeType).toBe('image/png');
    expect(r.transformations.length).toBeGreaterThan(0);
  });

  it('removes internal whitespace and line breaks', () => {
    const r = normalizeBase64Input('Zm9v\nYmFy\n');
    expect(r.normalized).toBe('Zm9vYmFy');
  });

  it('converts Base64URL alphabet back to standard', () => {
    const r = normalizeBase64Input('-_-_');
    expect(r.normalized).toBe('+/+/');
  });

  it('adds missing padding', () => {
    const r = normalizeBase64Input('Zm9vYg');
    expect(r.normalized).toBe('Zm9vYg==');
    expect(r.transformations.join()).toContain('padding character');
  });

  it('fixes excessive padding', () => {
    const r = normalizeBase64Input('Zm9vYmFy=');
    expect(r.normalized).toBe('Zm9vYmFy');
    expect(r.transformations.join()).toContain('excessive padding');
  });

  it('warns when data URL lacks base64 marker', () => {
    const r = normalizeBase64Input('data:text/plain,Zm9vYg==');
    expect(r.warnings.length).toBe(1);
    expect(r.normalized).toBe('Zm9vYg==');
  });

  it('handles combined messy input', () => {
    const r = normalizeBase64Input('  data:image/png;base64,\niVBORw0KGgo\n');
    expect(r.normalized).toBe('iVBORw0KGgo=');
  });

  it('strips a leading BOM from editor copies', () => {
    const r = normalizeBase64Input('\uFEFFZm9vYmFy');
    expect(r.normalized).toBe('Zm9vYmFy');
    expect(r.transformations.join()).toContain('byte-order mark');
  });
});

describe('validateBase64', () => {
  it('accepts valid base64', () => {
    const r = validateBase64('Zm9vYmFy');
    expect(r.valid).toBe(true);
    expect(r.estimatedBytes).toBe(6);
  });

  it('estimates decoded size with padding', () => {
    expect(validateBase64('Zm9vYg==').estimatedBytes).toBe(4);
    expect(validateBase64('Zm8=').estimatedBytes).toBe(2);
    expect(validateBase64('Zg==').estimatedBytes).toBe(1);
  });

  it('rejects empty input', () => {
    expect(validateBase64('').valid).toBe(false);
  });

  it('rejects truncated data (length % 4 === 1)', () => {
    const r = validateBase64('A');
    expect(r.valid).toBe(false);
    expect(r.errors.join()).toContain('truncated');
  });

  it('rejects invalid characters with positions', () => {
    const r = validateBase64('QUJD!DR?');
    expect(r.valid).toBe(false);
    expect(r.invalidPositions).toContain(4);
    expect(r.invalidPositions).toContain(7);
  });

  it('rejects characters after padding', () => {
    const r = validateBase64('QQ==QQ');
    expect(r.valid).toBe(false);
    expect(r.errors.join()).toContain('after padding');
  });

  it('rejects more than two padding characters', () => {
    const r = validateBase64('QQ===');
    expect(r.valid).toBe(false);
    expect(r.errors.join()).toContain('more than 2 padding');
  });
});

describe('detectFileType', () => {
  it('detects PNG', () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
    expect(detectFileType(bytes)?.extension).toBe('png');
  });

  it('detects JPEG', () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, ...Array.from('JFIF', (c) => c.charCodeAt(0))]);
    expect(detectFileType(bytes)?.extension).toBe('jpg');
  });

  it('detects PDF', () => {
    const bytes = new TextEncoder().encode('%PDF-1.7\n...');
    expect(detectFileType(bytes)?.extension).toBe('pdf');
  });

  it('detects ZIP', () => {
    const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 20, 0, 0, 0]);
    expect(detectFileType(bytes)?.extension).toBe('zip');
  });

  it('detects docx inside a ZIP container', () => {
    const head = [0x50, 0x4b, 0x03, 0x04, 20, 0, 0, 0];
    const wordDir = Array.from('word/', (c) => c.charCodeAt(0));
    expect(detectFileType(new Uint8Array([...head, ...wordDir]))?.extension).toBe('docx');
  });

  it('detects xlsx inside a ZIP container', () => {
    const head = [0x50, 0x4b, 0x03, 0x04, 20, 0, 0, 0];
    const xlDir = Array.from('xl/', (c) => c.charCodeAt(0));
    expect(detectFileType(new Uint8Array([...head, ...xlDir]))?.extension).toBe('xlsx');
  });

  it('detects GZIP', () => {
    expect(detectFileType(new Uint8Array([0x1f, 0x8b, 0x08, 0]))?.extension).toBe('gz');
  });

  it('detects WebP inside RIFF container', () => {
    const bytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect(detectFileType(bytes)?.extension).toBe('webp');
  });

  it('detects WAV inside RIFF container', () => {
    const bytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]);
    expect(detectFileType(bytes)?.extension).toBe('wav');
  });

  it('detects MP4 via ftyp brand', () => {
    const bytes = new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]);
    expect(detectFileType(bytes)?.extension).toBe('mp4');
  });

  it('detects AVIF via ftyp brand', () => {
    const bytes = new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]);
    expect(detectFileType(bytes)?.extension).toBe('avif');
  });

  it('detects HEIC (iPhone photos) via ftyp brand', () => {
    const bytes = new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]);
    expect(detectFileType(bytes)?.extension).toBe('heic');
  });

  it('detects MP3 via ID3 tag', () => {
    const bytes = new TextEncoder().encode('ID3\x04\x00rest-of-tag');
    expect(detectFileType(bytes)?.extension).toBe('mp3');
  });

  it('detects SVG markup', () => {
    const bytes = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    expect(detectFileType(bytes)?.extension).toBe('svg');
  });

  it('falls back to plain text for decodable UTF-8', () => {
    const bytes = new TextEncoder().encode('hello wörld');
    const t = detectFileType(bytes);
    expect(t?.category).toBe('text');
    expect(t?.extension).toBe('txt');
  });

  it('returns null for unknown binary', () => {
    expect(detectFileType(new Uint8Array([0xff, 0xfe, 0x00, 0x55]))).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(detectFileType(new Uint8Array(0))).toBeNull();
  });
});

describe('end-to-end: messy paste to typed file', () => {
  it('normalizes, validates and detects a pasted data-URL PNG', () => {
    // 10 bytes -> remainder 1 -> base64 ends with "==" so stripping it simulates real-world sloppy copy
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2]);
    const b64 = encodeBytesToBase64(pngBytes);
    expect(b64.endsWith('==')).toBe(true);
    const pasted = `data:image/png;base64,\n${b64.slice(0, -2)}\n`; // messy: prefix + newline + stripped padding

    const n = normalizeBase64Input(pasted);
    expect(n.detectedMimeType).toBe('image/png');
    const v = validateBase64(n.normalized);
    expect(v.valid).toBe(true);
    const bytes = decodeBase64ToBytes(n.normalized);
    expect(Array.from(bytes)).toEqual(Array.from(pngBytes));
    expect(detectFileType(bytes)?.extension).toBe('png');
  });
});
