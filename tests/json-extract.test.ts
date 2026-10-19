import { describe, expect, it } from 'vitest';
import { extractBase64FilesFromJson, extractBase64FromJsonFragment } from '../src/lib/json-extract';
import { decodeBase64ToBytes } from '../src/lib/base64';
import { detectFileType } from '../src/lib/filetype';

// Mirrors the real-world API shape that motivated this feature:
// an array of objects with metadata + Chinese fileName + Base64 PDF content
function makePdfB64(text: string): string {
  const bytes = new TextEncoder().encode(`%PDF-1.4\n${text}\n%%EOF\n`);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

describe('extractBase64FilesFromJson', () => {
  it('extracts multiple files from an API-style JSON array with Chinese filenames', () => {
    const json = JSON.stringify([
      { fileCode: 'TD0101', groupNum: '664bf1a2-1234', fileName: 'standards-form-table.pdf', fileContent: makePdfB64('first document') },
      { fileCode: 'TD0204', groupNum: '664bf1a3-5678', fileName: 'scoring-rules.pdf', fileContent: makePdfB64('second document') }
    ]);
    const files = extractBase64FilesFromJson(json);
    expect(files).not.toBeNull();
    expect(files!.length).toBe(2);
    expect(files![0].label).toBe('standards-form-table.pdf');
    expect(files![1].label).toBe('scoring-rules.pdf');

    const bytes = decodeBase64ToBytes(files![0].b64);
    expect(detectFileType(bytes)?.extension).toBe('pdf');
    expect(new TextDecoder().decode(bytes)).toContain('first document');
  });

  it('skips short metadata fields like ids and codes', () => {
    const json = JSON.stringify({
      fileCode: 'TD0101AB',
      groupNum: '664bf1a2',
      status: 'ok',
      fileContent: makePdfB64('real payload')
    });
    const files = extractBase64FilesFromJson(json);
    expect(files!.length).toBe(1);
    expect(files![0].label).toBe('TD0101AB'); // falls back to fileCode when fileName is absent
  });

  it('returns null for non-JSON input', () => {
    expect(extractBase64FilesFromJson('JVBERi0xLjQ=')).toBeNull();
    expect(extractBase64FilesFromJson('just some plain text')).toBeNull();
  });

  it('returns empty array for JSON without base64 payloads', () => {
    expect(extractBase64FilesFromJson('{"a":1,"b":"short text"}')).toEqual([]);
  });

  it('strips BOM before parsing JSON', () => {
    const json = '\uFEFF' + JSON.stringify({ fileContent: makePdfB64('bom prefixed') });
    const files = extractBase64FilesFromJson(json);
    expect(files!.length).toBe(1);
  });

  it('handles nested objects and arrays', () => {
    const json = JSON.stringify({
      data: {
        items: [{ name: 'alpha', fileContent: makePdfB64('nested file') }]
      }
    });
    const files = extractBase64FilesFromJson(json);
    expect(files!.length).toBe(1);
    expect(files![0].label).toBe('alpha');
  });

  it('accepts an alternate content key like base64 or content', () => {
    const json = JSON.stringify({ content: makePdfB64('alt key') });
    const files = extractBase64FilesFromJson(json);
    expect(files!.length).toBe(1);
  });

  it('recovers payloads from a partially-copied JSON response', () => {
    // Mirrors the real-world failure: copy started mid-fileContent of file 1,
    // so the text begins with raw base64 and continues with JSON fragments.
    const file1 = makePdfB64('first document with a longer payload to clear the size floor');
    const file2 = makePdfB64('second document also long enough for the fragment recovery');
    const damaged = `${file1}"},{"fileCode":"TD0204","groupNum":"664bf1a2-1234-4d5e","fileName":"scoring-rules.pdf","fileContent":"${file2}"}`;

    const files = extractBase64FromJsonFragment(damaged);
    expect(files).not.toBeNull();
    expect(files!.length).toBe(2);
    expect(files![0].label).toBe('File 1'); // its metadata was lost before the copy started
    expect(files![1].label).toBe('scoring-rules.pdf'); // recovered from the adjacent fileName field

    const bytes = decodeBase64ToBytes(files![0].b64);
    expect(new TextDecoder().decode(bytes)).toContain('first document');
  });

  it('fragment recovery ignores plain base64 without JSON punctuation', () => {
    expect(extractBase64FromJsonFragment(makePdfB64('no json here at all'))).toBeNull();
  });
});
