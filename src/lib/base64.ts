export interface NormalizeResult {
  normalized: string;
  transformations: string[];
  warnings: string[];
  detectedMimeType: string | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  invalidPositions: number[];
  estimatedBytes: number;
}

/**
 * Clean up pasted Base64 input before decoding:
 * - trim surrounding whitespace
 * - strip data: URL prefix (records detected MIME)
 * - remove internal line breaks and spaces
 * - convert Base64URL alphabet (- _) to standard (+ /)
 * - re-add missing / fix excessive padding
 *
 * Every automatic fix is reported in `transformations` so the UI can show
 * a transparent "what we did to your input" checklist.
 */
export function normalizeBase64Input(raw: string): NormalizeResult {
  const transformations: string[] = [];
  const warnings: string[] = [];
  let input = raw;
  let detectedMimeType: string | null = null;

  // BOM from editors like Notepad breaks decode at position 0
  if (input.charCodeAt(0) === 0xfeff) {
    transformations.push('removed byte-order mark');
    input = input.slice(1);
  }

  if (input.trim().length !== input.length) {
    transformations.push('trimmed surrounding whitespace');
    input = input.trim();
  }

  const dataUrl = input.match(/^data:([^;,]*)([^,]*),/);
  if (dataUrl) {
    detectedMimeType = dataUrl[1] || null;
    if (!dataUrl[2].includes('base64')) {
      warnings.push(
        'Data URL is not marked ;base64, attempting Base64 decode anyway'
      );
    } else {
      transformations.push('removed data-URL prefix');
    }
    input = input.slice(dataUrl[0].length);
  }

  if (/\s/.test(input)) {
    transformations.push('removed line breaks and spaces');
    input = input.replace(/\s+/g, '');
  }

  if (input.includes('-') || input.includes('_')) {
    transformations.push(
      'converted Base64URL to standard alphabet'
    );
    input = input.replace(/-/g, '+').replace(/_/g, '/');
  }

  const core = input.replace(/=+$/, '');
  const originalPadCount = input.length - core.length;
  const rem = core.length % 4;
  const expectedPad = rem === 2 ? 2 : rem === 3 ? 1 : 0;

  if (rem === 1) {
    // Truncated data cannot be fixed by padding; leave it and let validation report.
    input = core;
  } else {
    if (expectedPad > originalPadCount) {
      transformations.push(
        `added ${expectedPad} padding character(s)`
      );
    } else if (originalPadCount > expectedPad) {
      transformations.push('fixed excessive padding');
    }
    input = core + '='.repeat(expectedPad);
  }

  return { normalized: input, transformations, warnings, detectedMimeType };
}

/**
 * Validate a (preferably normalized) Base64 string.
 * Errors are bilingual so the same engine serves the Chinese-first MVP
 * and a future English version.
 */
export function validateBase64(b64: string): ValidationResult {
  const errors: string[] = [];
  const invalidPositions: number[] = [];

  if (!b64 || b64.length === 0) {
    return { valid: false, errors: ['input is empty'], invalidPositions: [], estimatedBytes: 0 };
  }

  let firstPad = -1;
  for (let i = 0; i < b64.length; i++) {
    const c = b64.charCodeAt(i);
    const ok =
      (c >= 65 && c <= 90) || // A-Z
      (c >= 97 && c <= 122) || // a-z
      (c >= 48 && c <= 57) || // 0-9
      c === 43 || // +
      c === 47; // /
    if (!ok) {
      if (c === 61) {
        if (firstPad === -1) firstPad = i;
      } else {
        invalidPositions.push(i);
      }
    }
  }

  if (invalidPositions.length > 0) {
    const preview = invalidPositions.slice(0, 5).join(', ');
    errors.push(
      `found ${invalidPositions.length} invalid character(s) — first at position ${preview}${invalidPositions.length > 5 ? ' …' : ''}`
    );
  }

  if (firstPad !== -1) {
    const trailing = b64.length - firstPad;
    const rest = b64.slice(firstPad).replace(/=/g, '');
    if (rest.length > 0) {
      errors.push('characters found after padding');
    } else if (trailing > 2) {
      errors.push('more than 2 padding characters');
    }
  }

  const coreLen = b64.replace(/=+$/, '').length;
  if (coreLen % 4 === 1) {
    errors.push('length remainder is 1, data looks truncated');
  }

  const estimatedBytes = Math.floor((coreLen * 3) / 4);

  return { valid: errors.length === 0, errors, invalidPositions, estimatedBytes };
}

export function decodeBase64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function encodeBytesToBase64(bytes: Uint8Array, options: { urlSafe?: boolean } = {}): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  let b64 = btoa(binary);
  if (options.urlSafe) {
    b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return b64;
}

export function utf8ToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}
