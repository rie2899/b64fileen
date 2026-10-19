import { describe, expect, it } from 'vitest';
import { encodeBytesToBase64 } from '../src/lib/base64';
import { decodeBase64InWorker, encodeBytesInWorker } from '../src/lib/b64-worker';

// Node/vitest has no Worker — these assert the main-thread fallback path,
// which is exactly what old browsers get too.
describe('b64 worker helpers fall back to main thread', () => {
  it('encodes without a Worker environment', async () => {
    const bytes = new TextEncoder().encode('hello worker fallback');
    const out = await encodeBytesInWorker(bytes, false);
    expect(out).toBe(encodeBytesToBase64(bytes));
  });

  it('decodes without a Worker environment', async () => {
    const b64 = encodeBytesToBase64(new TextEncoder().encode('roundtrip'));
    const bytes = await decodeBase64InWorker(b64);
    expect(new TextDecoder().decode(bytes)).toBe('roundtrip');
  });
});
