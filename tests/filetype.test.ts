import { describe, expect, it } from 'vitest';
import { detectFileType } from '../src/lib/filetype';

const bytesOf = (...values: number[]): Uint8Array => new Uint8Array(values);
const asciiBytes = (s: string): number[] => [...s].map((c) => c.charCodeAt(0));

describe('detectFileType — font and image signatures that were previously unknown', () => {
  it('recognises WOFF2 from the wOF2 signature', () => {
    const type = detectFileType(bytesOf(...asciiBytes('wOF2'), 0, 0, 0, 0));
    expect(type?.extension).toBe('woff2');
    expect(type?.mime).toBe('font/woff2');
  });

  it('recognises WOFF 1 from wOFF', () => {
    const type = detectFileType(bytesOf(...asciiBytes('wOFF')));
    expect(type?.extension).toBe('woff');
  });

  it('separates OpenType from TrueType', () => {
    expect(detectFileType(bytesOf(...asciiBytes('OTTO'), 0, 0, 0, 0))?.extension).toBe('otf');
    expect(detectFileType(bytesOf(0x00, 0x01, 0x00, 0x00, 0xff, 0xff))?.extension).toBe('ttf');
  });

  it('recognises WebP only when the WEBP marker follows RIFF', () => {
    const webp = bytesOf(...asciiBytes('RIFF'), 0x24, 0, 0, 0, ...asciiBytes('WEBP'));
    expect(detectFileType(webp)?.extension).toBe('webp');

    const wav = bytesOf(...asciiBytes('RIFF'), 0x24, 0, 0, 0, ...asciiBytes('WAVE'));
    expect(detectFileType(wav)?.extension).toBe('wav');
  });
});
