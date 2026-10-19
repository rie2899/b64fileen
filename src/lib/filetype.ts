export type FileCategory = 'image' | 'document' | 'archive' | 'audio' | 'video' | 'binary' | 'text';

export interface DetectedFileType {
  mime: string;
  extension: string;
  label: string;
  category: FileCategory;
}

const ascii = (s: string): number[] => Array.from(s, (c) => c.charCodeAt(0));

function startsWith(bytes: Uint8Array, prefix: number[], offset = 0): boolean {
  if (bytes.length < offset + prefix.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (bytes[offset + i] !== prefix[i]) return false;
  }
  return true;
}

function containsEarly(bytes: Uint8Array, prefix: number[], limit = 512): boolean {
  const end = Math.min(bytes.length, limit);
  outer: for (let i = 0; i + prefix.length <= end; i++) {
    for (let j = 0; j < prefix.length; j++) {
      if (bytes[i + j] !== prefix[j]) continue outer;
    }
    return true;
  }
  return false;
}

/**
 * Detect file type from magic bytes. Covers the formats people actually
 * paste as Base64: images, PDF, archives, audio/video, executables, and
 * falls back to UTF-8 text sniffing. Returns null for unknown binaries —
 * the UI then offers a raw download instead of pretending to know.
 */
export function detectFileType(bytes: Uint8Array): DetectedFileType | null {
  if (bytes.length === 0) return null;

  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return { mime: 'image/png', extension: 'png', label: 'PNG image', category: 'image' };
  if (startsWith(bytes, [0xff, 0xd8, 0xff]))
    return { mime: 'image/jpeg', extension: 'jpg', label: 'JPEG image', category: 'image' };
  if (startsWith(bytes, ascii('GIF8')))
    return { mime: 'image/gif', extension: 'gif', label: 'GIF image', category: 'image' };
  if (startsWith(bytes, [0x42, 0x4d]))
    return { mime: 'image/bmp', extension: 'bmp', label: 'BMP image', category: 'image' };
  if (startsWith(bytes, [0x00, 0x00, 0x01, 0x00]))
    return { mime: 'image/x-icon', extension: 'ico', label: 'ICO icon', category: 'image' };

  if (startsWith(bytes, ascii('RIFF'))) {
    if (startsWith(bytes, ascii('WEBP'), 8))
      return { mime: 'image/webp', extension: 'webp', label: 'WebP image', category: 'image' };
    if (startsWith(bytes, ascii('WAVE'), 8))
      return { mime: 'audio/wav', extension: 'wav', label: 'WAV audio', category: 'audio' };
    if (startsWith(bytes, ascii('AVI '), 8))
      return { mime: 'video/x-msvideo', extension: 'avi', label: 'AVI video', category: 'video' };
  }

  if (startsWith(bytes, ascii('%PDF')))
    return { mime: 'application/pdf', extension: 'pdf', label: 'PDF document', category: 'document' };

  if (
    startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(bytes, [0x50, 0x4b, 0x07, 0x08])
  ) {
    // ZIP container — sniff which Office flavor it wraps (first local entries)
    if (containsEarly(bytes, ascii('word/'), 1024))
      return {
        mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: 'docx',
        label: 'Word document (.docx)',
        category: 'document'
      };
    if (containsEarly(bytes, ascii('xl/'), 1024))
      return {
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx',
        label: 'Excel workbook (.xlsx)',
        category: 'document'
      };
    if (containsEarly(bytes, ascii('ppt/'), 1024))
      return {
        mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        extension: 'pptx',
        label: 'PowerPoint presentation (.pptx)',
        category: 'document'
      };
    return { mime: 'application/zip', extension: 'zip', label: 'ZIP archive (.docx/.xlsx are ZIP too)', category: 'archive' };
  }
  if (startsWith(bytes, [0x1f, 0x8b]))
    return { mime: 'application/gzip', extension: 'gz', label: 'GZIP archive', category: 'archive' };
  if (startsWith(bytes, ascii('Rar!')))
    return { mime: 'application/vnd.rar', extension: 'rar', label: 'RAR archive', category: 'archive' };
  if (startsWith(bytes, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]))
    return { mime: 'application/x-7z-compressed', extension: '7z', label: '7Z archive', category: 'archive' };

  if (
    startsWith(bytes, ascii('ID3')) ||
    startsWith(bytes, [0xff, 0xfb]) ||
    startsWith(bytes, [0xff, 0xf3]) ||
    startsWith(bytes, [0xff, 0xf2])
  )
    return { mime: 'audio/mpeg', extension: 'mp3', label: 'MP3 audio', category: 'audio' };
  if (startsWith(bytes, ascii('OggS')))
    return { mime: 'audio/ogg', extension: 'ogg', label: 'OGG audio', category: 'audio' };
  if (startsWith(bytes, ascii('fLaC')))
    return { mime: 'audio/flac', extension: 'flac', label: 'FLAC audio', category: 'audio' };

  if (bytes.length >= 12 && startsWith(bytes, ascii('ftyp'), 4)) {
    const brand = String.fromCharCode(...bytes.subarray(8, 12));
    if (brand.startsWith('qt'))
      return { mime: 'video/quicktime', extension: 'mov', label: 'MOV video', category: 'video' };
    if (brand.startsWith('M4A'))
      return { mime: 'audio/mp4', extension: 'm4a', label: 'M4A audio', category: 'audio' };
    if (brand.startsWith('avif') || brand.startsWith('avis'))
      return { mime: 'image/avif', extension: 'avif', label: 'AVIF image', category: 'image' };
    if (brand.startsWith('heic') || brand.startsWith('heix') || brand.startsWith('hevc'))
      return { mime: 'image/heic', extension: 'heic', label: 'HEIC image (iPhone photos)', category: 'image' };
    return { mime: 'video/mp4', extension: 'mp4', label: 'MP4 video', category: 'video' };
  }

  if (startsWith(bytes, ascii('MZ')))
    return { mime: 'application/x-msdownload', extension: 'exe', label: 'Windows executable', category: 'binary' };
  if (startsWith(bytes, [0x7f, 0x45, 0x4c, 0x46]))
    return { mime: 'application/x-elf', extension: 'elf', label: 'ELF executable', category: 'binary' };
  if (startsWith(bytes, ascii('SQLite format 3')))
    return { mime: 'application/x-sqlite3', extension: 'db', label: 'SQLite database', category: 'binary' };

  if (startsWith(bytes, ascii('<svg')) || containsEarly(bytes, ascii('<svg')))
    return { mime: 'image/svg+xml', extension: 'svg', label: 'SVG image', category: 'image' };

  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (!text.includes('\ufffd')) {
      return { mime: 'text/plain', extension: 'txt', label: 'Plain text', category: 'text' };
    }
  } catch {
    // Not valid UTF-8 — fall through to unknown binary.
  }

  return null;
}
