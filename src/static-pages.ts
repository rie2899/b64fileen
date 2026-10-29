import pageRegistry from '../page-registry.json';
import { BRAND, DEFAULT_SITE_URL, FEEDBACK_EMAIL, ZH_SITE_URL } from './site-config';

export type PageId = string;
import { guidePages } from './guide-pages';
export type ToolMode = 'to-file' | 'to-base64' | 'text';

export interface Faq {
  q: string;
  a: string;
}

export interface Section {
  h2: string;
  html: string;
}

export interface PageContent {
  title: string;
  desc: string;
  h1: string;
  answer: string;
  mode: ToolMode;
  /** Default direction in text mode (encode unless noted) */
  textDir?: 'encode' | 'decode';
  /** Above-the-fold facts — also the first thing AI search engines can quote */
  quick?: string[];
  sections: Section[];
  faqs: Faq[];
}

export const pagePaths: Record<PageId, string> = Object.fromEntries(
  pageRegistry.map((p) => [p.id, p.path])
);

export const pageData: Record<PageId, PageContent> = {
  home: {
    title: 'Base64 to File & File to Base64 — Free Online Converter',
    desc: 'Free browser-based Base64 tools: decode Base64 into a real file, encode files to Base64, and convert text both ways. Prefixes and padding are repaired automatically — just paste.',
    h1: 'Base64 to File · File to Base64',
    answer:
      'Paste it in. Raw Base64, a full data: URL, or an entire JSON API response — the tool inspects the input first, repairs what it can, and tells you exactly where the data breaks. Images, PDFs and archives are all recognized. The result appears as you paste; there is no button to press.',
    mode: 'to-file',
    quick: [
      'Runs entirely in your browser — nothing is uploaded',
      'File type read from the header, not the file name',
      'Missing padding and stray line breaks fixed for you',
      'Paste, drop a file, or Ctrl+V a screenshot',
      'Over 20 file types recognized from magic bytes'
    ],
    sections: [
      {
        h2: 'How to use it: three steps',
        html: `<ol class="steps">
          <li><strong>Paste it in</strong> — paste, drop a file, or Ctrl+V a screenshot. Any format works</li>
          <li><strong>Read the report</strong> — prefixes, line breaks and missing padding are repaired for you; broken data is named precisely</li>
          <li><strong>Take the file</strong> — download the restored file, or copy the encoded result</li>
        </ol>`
      },
      {
        h2: 'How it works',
        html: `<div class="grid-3">
          <div class="mini-card"><div class="mc-bar">static_site</div><strong>The server only serves pages</strong><p>There is no backend API — just static files. Everything you see is the whole app, and the conversion runs in your browser.</p></div>
          <div class="mini-card"><div class="mc-bar">instant</div><strong>Results as you paste</strong><p>No network round trip and no spinner: the result is there the moment the input lands.</p></div>
          <div class="mini-card"><div class="mc-bar">magic_bytes</div><strong>Type detected from magic bytes</strong><p>Not from the extension. A file starting with %PDF is a PDF even if it is named .exe. Over 20 formats are recognized out of the box.</p></div>
        </div>`
      }
    ],
    faqs: [
      {
        q: 'Which file types are supported?',
        a: 'Images (PNG, JPEG, GIF, WebP, SVG), PDF, Word, Excel and PowerPoint (Office Open XML), ZIP, MP3 and other audio, plus plain text. The type comes from the file header, so a wrong file name does not matter.'
      },
      {
        q: 'How large can the input be?',
        a: 'Up to 100 MB. Anything above a few megabytes is processed on a background thread, so the page stays responsive while it works.'
      },
      {
        q: 'Is Base64 encryption?',
        a: 'No. Base64 is an encoding that lets binary data travel through text channels — anyone can decode it in seconds. Never use it to protect passwords, keys or personal data.'
      },
      {
        q: 'What if decoding fails?',
        a: 'The report names the exact position of the bad character and the likely cause: invalid characters, missing padding, truncated data, or Base64URL mixed with the standard alphabet. Each fix is covered under <a href="/base64-decode-errors/">common Base64 decode errors</a>.'
      }
    ]
  },

  'base64-to-file': {
    title: 'Base64 to File Converter — Decode Base64 Online (Free)',
    desc: 'Decode Base64 back into a real file: PDF, image, Office document, ZIP or audio. The file type is detected from the data itself, and broken input is repaired or explained.',
    h1: 'Base64 to File Converter',
    answer:
      'Paste Base64 in and get a real file back. Missing padding, stray line breaks and data: URL prefixes are cleaned up for you, and the original file type is recovered from the file header — you do not need to know what the file was.',
    mode: 'to-file',
    sections: [
      {
        h2: 'What gets fixed automatically',
        html: `<ul>
          <li><strong>Missing padding</strong> — trailing <code>=</code> characters are restored</li>
          <li><strong>Line breaks and spaces</strong> — wrapped output from email or MIME is joined back together</li>
          <li><strong>data: URL prefixes</strong> — <code>data:application/pdf;base64,</code> and friends are stripped</li>
          <li><strong>Base64URL alphabet</strong> — <code>-</code> and <code>_</code> are mapped back to <code>+</code> and <code>/</code></li>
          <li><strong>Byte-order marks</strong> — a stray BOM at the start is removed</li>
          <li><strong>JSON wrappers</strong> — an API response is scanned for embedded <code>fileContent</code> fields</li>
        </ul>`
      },
      {
        h2: 'Supported file types',
        html: `<p>The type is read from the first bytes of the decoded data, not from a file name — so the output arrives with the right extension and opens with the right app.</p>
        <p>Images (PNG, JPEG, GIF, WebP, BMP, SVG), PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), ZIP, RAR, 7z, MP3, WAV, MP4 and plain text.</p>`
      },
      {
        h2: 'When you do not know the original file name',
        html: `<p>Base64 rarely carries a file name — only the bytes. The tool still recovers the <em>type</em> from the header and suggests a sensible name, so the download opens correctly. If the content came from a JSON API response with a <code>fileName</code> field, use <a href="/json-to-file/">extract files from JSON</a> instead: it reads the original names too.</p>`
      }
    ],
    faqs: [
      {
        q: 'Can I convert without knowing the file type?',
        a: 'Yes. The type is detected from the decoded bytes, so you can paste Base64 with no context at all and still get a file with a correct extension.'
      },
      {
        q: 'The restored file will not open — why?',
        a: 'Usually the Base64 was truncated when it was copied: the decoded bytes run out mid-file. Compare the length against the source, or grab the data programmatically instead of copy-pasting. See <a href="/base64-decode-errors/">decode errors</a>.'
      },
      {
        q: 'Are data: URL prefixes supported?',
        a: 'Yes. A full data URL is accepted, the prefix is stripped and the MIME type is kept for naming the output.'
      }
    ]
  },

  'file-to-base64': {
    title: 'File to Base64 Converter — Encode Any File Online',
    desc: 'Encode a file to Base64 in the browser: images, PDF, Office documents, archives or audio. Output as raw Base64, a data: URL, or URL-safe Base64 with 76-character wrapping.',
    h1: 'File to Base64 Converter',
    answer:
      'Drop a file in and get Base64 out — no upload, since the file is read locally in your browser. Pick the flavour you need: raw Base64, a ready-to-paste data: URL, or URL-safe Base64 for tokens and URLs. Large files are encoded on a background thread.',
    mode: 'to-base64',
    sections: [
      {
        h2: 'When you need file to Base64',
        html: `<ul>
          <li><strong>Embedding assets in HTML or CSS</strong> — inline a small image so the page needs one fewer request</li>
          <li><strong>JSON APIs</strong> — many upload endpoints expect the file body as a Base64 string field</li>
          <li><strong>Emails and templates</strong> — attachments as text survive systems that strip binary</li>
          <li><strong>Tokens and signatures</strong> — with the URL-safe alphabet so <code>+</code> and <code>/</code> do not break URLs</li>
        </ul>`
      },
      {
        h2: 'Three output formats',
        html: `<div class="grid-3">
          <div class="mini-card"><div class="mc-bar">raw</div><strong>Plain Base64</strong><p>Just the encoded characters — what most APIs and databases expect.</p></div>
          <div class="mini-card"><div class="mc-bar">data_url</div><strong>data: URL</strong><p>Prefix included, so the string works directly as a <code>src</code> in HTML or CSS.</p></div>
          <div class="mini-card"><div class="mc-bar">url_safe</div><strong>URL-safe + wrapping</strong><p><code>-</code> <code>_</code> instead of <code>+</code> <code>/</code>, no padding, optional 76-character lines for MIME.</p></div>
        </div>`
      }
    ],
    faqs: [
      {
        q: 'How much bigger does the encoded output get?',
        a: 'Base64 adds about 33 percent: every 3 bytes become 4 characters. A 1 MB file produces roughly 1.37 MB of text, so keep per-file size in mind when inlining assets.'
      },
      {
        q: 'Can I convert several files at once?',
        a: 'Drop multiple files into the panel and each one is encoded separately, with its own copy button — convenient for pasting results into an API payload or a config file.'
      }
    ]
  },

  'base64-to-image': {
    title: 'Base64 to Image — Decode Base64 to PNG/JPG Online',
    desc: 'Turn a Base64 string back into an image and preview it on the page. Handles data: URL prefixes, missing padding and line breaks, and detects PNG, JPEG, GIF, WebP and SVG.',
    h1: 'Base64 to Image Converter',
    answer:
      'Paste a Base64 image string and see it immediately. The data: URL prefix is stripped, padding is repaired, and the format is read from the file header — then download the image, or copy it as a data URL to reuse elsewhere.',
    mode: 'to-file',
    sections: [
      {
        h2: 'Common image Base64 prefixes',
        html: `<div class="simple-table"><table>
          <thead><tr><th>Prefix</th><th>Format</th></tr></thead>
          <tbody>
            <tr><td><code>data:image/png;base64,</code></td><td>PNG</td></tr>
            <tr><td><code>data:image/jpeg;base64,</code></td><td>JPEG</td></tr>
            <tr><td><code>data:image/gif;base64,</code></td><td>GIF</td></tr>
            <tr><td><code>data:image/webp;base64,</code></td><td>WebP</td></tr>
            <tr><td><code>data:image/svg+xml;base64,</code></td><td>SVG</td></tr>
          </tbody>
        </table></div>
        <p>None of these prefixes are part of the Base64 data itself. Leaving one in is the single most common cause of a decode error — the tool removes it for you.</p>`
      },
      {
        h2: 'Is the preview the original image?',
        html: `<p>Yes. The bytes are decoded exactly as they were encoded and rendered by your browser, with no re-compression or resizing. Downloading gives you the original file back, not a screenshot of the preview.</p>`
      }
    ],
    faqs: [
      {
        q: 'The decoded image will not display — why?',
        a: 'Either the data was truncated (the string was cut short when copied) or the bytes are not an image at all. The report tells you which: it names the detected type, or the position of the first invalid character.'
      },
      {
        q: 'Is SVG supported?',
        a: 'Yes — see <a href="/base64-to-svg/">Base64 to SVG</a> for the specific case where the payload is an SVG vector.'
      },
      {
        q: 'Can I convert a Base64 image to PNG?',
        a: 'The tool restores the original format rather than re-encoding it, so a JPEG stays a JPEG. If you need a different format, open the restored file and re-save it — that also keeps the image quality under your control.'
      }
    ]
  },

  'image-to-base64': {
    title: 'Image to Base64 Converter — Data URL for HTML & CSS',
    desc: 'Encode an image to Base64 and paste it straight into HTML, CSS or a JSON payload. Supports PNG, JPEG, GIF, WebP and SVG, with an optional data: URL prefix.',
    h1: 'Image to Base64 Converter',
    answer:
      'Drop an image in and copy the Base64 string, or the full data: URL if you want to use it directly in markup. The file never leaves your browser, so private screenshots and product shots stay on your machine.',
    mode: 'to-base64',
    sections: [
      {
        h2: 'Using it in HTML',
        html: `<p>With the data: URL option enabled, the output drops straight into an <code>img</code> tag — useful for one-off assets, email templates and pages that must render from a single file.</p>
        <div class="code-block">&lt;img src="data:image/png;base64,iVBORw0KGgo..." alt="Logo" /&gt;</div>`
      },
      {
        h2: 'Using it in CSS',
        html: `<p>Background images and icons work the same way, and a small asset inlined this way removes a request from the critical path.</p>
        <div class="code-block">.icon { background-image: url("data:image/svg+xml;base64,PHN2Zy..."); }</div>`
      },
      {
        h2: 'Things to watch out for',
        html: `<ul>
          <li><strong>Size</strong> — inlining adds about 33 percent, and it cannot be cached separately from the page</li>
          <li><strong>Wrapping</strong> — the data: URL must stay on one line; if you wrap at 76 characters, do not add the prefix</li>
          <li><strong>Readability</strong> — large inline blobs make source files hard to diff and review; keep them for small assets</li>
        </ul>`
      }
    ],
    faqs: [
      {
        q: 'The encoded string is enormous — can I shrink it?',
        a: 'Base64 is a fixed 33 percent overhead, so the real lever is the image itself: resize or compress before encoding. For icons, an inline SVG is usually far smaller and scales better.'
      },
      {
        q: 'Can the output go straight into CSS?',
        a: 'Yes, with the data: URL option on and line wrapping off. Wrapped output is only for formats like MIME and PEM that expect fixed-width lines.'
      },
      {
        q: 'Is there a size limit?',
        a: 'Up to 100 MB per file. For anything over a few megabytes, consider whether the asset really belongs inline — browsers handle a separate file far better.'
      }
    ]
  },

  'base64-to-pdf': {
    title: 'Base64 to PDF — Decode a Base64 PDF Online',
    desc: 'Decode Base64 into a real PDF file in your browser. Handles data: URL prefixes and broken padding, verifies the %PDF header, and tells you when the data is truncated.',
    h1: 'Base64 to PDF Converter',
    answer:
      'Paste the Base64 and get a PDF back. The tool checks for a valid %PDF header before handing it over, so you know immediately whether the data is intact instead of opening a file that turns out to be corrupt.',
    mode: 'to-file',
    sections: [
      {
        h2: 'Where Base64 PDFs come from',
        html: `<ul>
          <li><strong>Invoices and contracts from APIs</strong> — accounting and e-signature services commonly return a document as a Base64 field</li>
          <li><strong>Email attachments</strong> — MIME encodes attachments as Base64, usually wrapped at 76 characters</li>
          <li><strong>Document storage exports</strong> — database dumps and backup jobs that store files as text</li>
        </ul>`
      },
      {
        h2: 'How the tool knows it really is a PDF',
        html: `<p>Every PDF starts with the bytes <code>%PDF</code> and ends with <code>%%EOF</code>. The decoded data is checked against both, so a truncated copy is reported as broken instead of being saved as an unopenable file. The same check is what recovers the type when you have no file name at all.</p>`
      }
    ],
    faqs: [
      {
        q: 'The restored PDF will not open — what now?',
        a: 'Almost always truncated data: the Base64 was cut short while copying. Copy from the raw API response rather than a rendered page, and check the string ends with <code>%%EOF</code> once decoded.'
      },
      {
        q: 'Are encrypted PDFs supported?',
        a: 'The bytes are restored exactly as they were encoded, so a password-protected PDF is saved as-is and still asks for its password when opened. Decryption is not attempted.'
      }
    ]
  },

  'pdf-to-base64': {
    title: 'PDF to Base64 Converter — Encode a PDF Online',
    desc: 'Encode a PDF to Base64 in your browser for API payloads, database fields or email attachments. Choose raw Base64, a data: URL, or URL-safe output.',
    h1: 'PDF to Base64 Converter',
    answer:
      'Drop a PDF in and copy the encoded string. Nothing is uploaded — the file is read locally — and large documents are encoded on a background thread so the page stays usable while it runs.',
    mode: 'to-base64',
    sections: [
      {
        h2: 'Common uses',
        html: `<ul>
          <li><strong>Upload endpoints</strong> — services that accept a document as a JSON string field</li>
          <li><strong>Database storage</strong> — smaller PDFs parked in a text column when a file store is overkill</li>
          <li><strong>Email and templating</strong> — attachments as text pass through systems that strip binary</li>
        </ul>`
      },
      {
        h2: 'Size expectations',
        html: `<p>Base64 costs about 33 percent: a 3 MB PDF becomes roughly 4 MB of text. That growth happens again in transit and in memory, which is why most APIs cap encoded payloads well below their nominal limit. If the request fails with a size error, the PDF itself is usually the thing to shrink.</p>`
      }
    ],
    faqs: [
      {
        q: 'Are scanned PDFs handled differently?',
        a: 'No. Scanned and text PDFs are encoded the same way — the bytes are what matter. Just note that scans are image-heavy, so the encoded string grows accordingly.'
      }
    ]
  }
,

  'base64-decode-errors': {
    title: 'Base64 Decode Error? 5 Causes and How to Fix Them',
    desc: 'Invalid character, bad padding, truncated data, Base64URL misuse, forgotten data: prefix — the five reasons Base64 decoding fails, what each error message means, and how to fix it fast.',
    h1: 'Base64 Decode Errors: Causes and Fixes',
    answer:
      'Almost every Base64 failure is one of five things: an illegal character, missing or extra padding, truncated data, Base64URL and standard alphabets mixed, or a data: URL prefix left in place. Each one has a distinct error message — here is what they mean and the fastest way to fix it.',
    mode: 'to-file',
    quick: [
      'Length must be a multiple of 4 — 1 left over means truncated data',
      'Padding <code>=</code> only appears at the very end (at most two)',
      'data: URL prefixes are not part of the data',
      'Paste it into the tool above to see which one you hit',
      'Repairs are reported, never applied silently'
    ],
    sections: [
      {
        h2: '1. Illegal characters',
        html: `<p>Standard Base64 uses <code>A-Z</code>, <code>a-z</code>, <code>0-9</code>, <code>+</code>, <code>/</code> and the padding <code>=</code>. Anything else — a space in the middle, a smart quote from a chat app, a truncated emoji, a stray newline inside the string — makes the whole input invalid.</p>
        <p><strong>The usual culprits:</strong> copying from a rendered web page instead of the raw response, a chat client that "helpfully" adds line breaks, or a spreadsheet that auto-formatted the cell.</p>
        <p><strong>Fix:</strong> copy from the raw source. If the data has line breaks that are legitimate (MIME wraps at 76 characters), the <a href="/base64-to-file/">converter</a> strips them for you and reports the exact position of anything that is still wrong.</p>`
      },
      {
        h2: '2. Missing or extra padding',
        html: `<p>Base64 lengths must be a multiple of 4, and the encoder adds <code>=</code> to fill the gap (one or two characters, never more). When a string is copied by hand the trailing <code>=</code> are the first thing to get lost.</p>
        <p><strong>Fix:</strong> use the <a href="/base64-to-file/">Base64 to file tool</a> — missing padding is restored and excessive padding is trimmed, so you never count characters by hand.</p>`
      },
      {
        h2: '3. Truncated data (length mod 4 == 1)',
        html: `<p>If the length leaves a remainder of 1 after dividing by 4, the data cannot possibly be complete — no valid Base64 string ends that way. The remainder is 1 only when bytes were lost, which is why this message always means truncation rather than a formatting problem.</p>
        <p><strong>Common causes:</strong> a copy that stopped early inside a browser console, a log line cut off at a maximum length, a database column too small for the stored string.</p>
        <p><strong>Fix:</strong> this one cannot be repaired — the bytes are gone. Re-fetch the data from the source, or export it programmatically rather than copying it through a UI.</p>`
      },
      {
        h2: '4. Base64URL mixed with the standard alphabet',
        html: `<p>URL-safe Base64 replaces <code>+</code> with <code>-</code> and <code>/</code> with <code>_</code>, and usually omits padding. JWT segments and URL parameters use that alphabet, while most APIs and file dumps use the standard one. Mixing them, or forgetting which variant you are holding, produces an illegal-character error on a string that looks perfectly fine.</p>
        <p><strong>Fix:</strong> the tool detects the URL-safe alphabet and maps it back automatically. For the details, see <a href="/base64url/">Base64URL and the URL-safe alphabet</a>.</p>`
      },
      {
        h2: '5. data: URL prefix left in place',
        html: `<p><code>data:image/png;base64,</code> is not part of the data — it is the marker in front of it. Feeding the whole string to a decoder without stripping the prefix fails on the first character.</p>
        <p><strong>Fix:</strong> the <a href="/base64-to-file/">conversion tool</a> removes the prefix for you and remembers the MIME type for naming the output. See also <a href="/data-url/">Data URL generation and parsing</a>.</p>`
      }
    ],
    faqs: [
      {
        q: 'Does a length remainder of 1 always mean the data is corrupt?',
        a: 'Yes for standard Base64. A remainder of 1 cannot be produced by a valid encoder, so it always indicates missing bytes rather than a formatting quirk.'
      },
      {
        q: 'Decoding succeeded but the file will not open — how is that possible?',
        a: 'The characters were valid but the bytes are not a complete file: the Base64 was cut at a multiple-of-4 boundary, or the content is something other than what the name suggests. The tool reports the detected type from the file header so you can tell the two apart.'
      },
      {
        q: 'Is there a tool that repairs this automatically?',
        a: 'The converter on this page fixes padding, line breaks, BOMs, data: prefixes and the URL-safe alphabet automatically, then reports anything that genuinely cannot be repaired — like truncated data.'
      }
    ]
  },

  'base64-to-word': {
    title: 'Base64 to Word (.docx) Converter — Decode Online',
    desc: 'Decode Base64 into a Word document. Detects Office Open XML from the ZIP/PK header and warns you when the data is legacy .doc instead of .docx.',
    h1: 'Base64 to Word Converter',
    answer:
      'Paste the Base64 and download the .docx. Word files are ZIP containers, so the tool checks for the PK header that modern Office formats start with — which is also how it tells a .docx from other ZIP-based files.',
    mode: 'to-file',
    sections: [
      {
        h2: 'Where Base64 Word documents come from',
        html: `<ul>
          <li><strong>Document APIs</strong> — e-signature and reporting services that return a generated .docx as a string field</li>
          <li><strong>Backups and exports</strong> — systems that store uploaded documents as text</li>
          <li><strong>Email pipelines</strong> — MIME attachments captured on their way through</li>
        </ul>`
      },
      {
        h2: 'How a .docx is recognized',
        html: `<p>Office Open XML files are ZIP archives: the decoded bytes begin with <code>PK</code>. Inside, a real .docx contains <code>word/document.xml</code>, while .xlsx and .pptx contain their own parts — that is how the type is pinned down without relying on a file name.</p>`
      },
      {
        h2: 'Legacy .doc files',
        html: `<p>Word 97-2003 files use a completely different binary format and start with <code>D0 CF 11 E0</code> instead. They are detected as a generic compound document and saved with a <code>.doc</code> extension; the contents are untouched either way.</p>`
      }
    ],
    faqs: [
      {
        q: 'Can it convert formats, for example .docx to PDF?',
        a: 'No — the tool restores the original file exactly as encoded. Format conversion is a different job: open the restored document in Word, LibreOffice or Google Docs and export from there.'
      },
      {
        q: 'Will WPS Office open the result?',
        a: 'Yes. WPS reads standard Office Open XML, and since the bytes are identical to the original file, anything that opened it before will open it again.'
      }
    ]
  },

  'base64-to-excel': {
    title: 'Base64 to Excel (.xlsx) Converter — Decode Online',
    desc: 'Decode Base64 into an Excel workbook. Recognizes .xlsx and macro-enabled .xlsm from the OOXML structure, and explains why the contents cannot be previewed here.',
    h1: 'Base64 to Excel Converter',
    answer:
      'Paste the Base64 and download the spreadsheet. Both .xlsx and macro-enabled .xlsm are recognized from the archive structure; the file is restored byte for byte, so formulas, styles and sheets all survive.',
    mode: 'to-file',
    sections: [
      {
        h2: 'Where Base64 workbooks come from',
        html: `<ul>
          <li><strong>Reporting APIs</strong> — endpoints that generate a spreadsheet on demand and return it as a string</li>
          <li><strong>CRM and ERP exports</strong> — scheduled exports delivered as Base64 instead of a file link</li>
          <li><strong>Automation pipelines</strong> — n8n, Zapier and similar tools pass files as Base64 between steps</li>
        </ul>`
      },
      {
        h2: 'How an .xlsx is recognized',
        html: `<p>The workbook is a ZIP archive; the decoded bytes start with <code>PK</code> and contain an <code>xl/</code> directory. A macro-enabled workbook carries <code>vbaProject.bin</code> inside, which is how .xlsm is separated from .xlsx.</p>`
      },
      {
        h2: 'Macro-enabled .xlsm files',
        html: `<p>Macros are preserved because the bytes are not rewritten. Be deliberate about opening a macro-enabled workbook from an untrusted source: the tool restores the file faithfully, which means it also restores anything the file intends to run.</p>`
      }
    ],
    faqs: [
      {
        q: 'Can the tool preview the table contents?',
        a: 'No. Reading the cell values means parsing the whole workbook, which would mean shipping a spreadsheet engine into the browser for a case that is better served by opening the downloaded file.'
      },
      {
        q: 'Is CSV supported?',
        a: 'A CSV is plain text, so it decodes to text rather than to a workbook — use <a href="/base64-to-text/">Base64 to text</a>, or the TXT page if you want the output saved as a file.'
      }
    ]
  },

  'json-to-file': {
    title: 'Extract Base64 Files from JSON — API Response Decoder',
    desc: 'Paste an API response and pull out every Base64 file inside it. Reads fileContent and fileName fields, restores each attachment with its original name, and recovers partial copies.',
    h1: 'Extract Base64 Files from JSON',
    answer:
      'Paste the whole API response instead of picking strings out by hand. The tool walks the JSON, finds every Base64 payload, matches it with its file name, and hands you each file separately — including when the response was copied incompletely.',
    mode: 'to-file',
    sections: [
      {
        h2: 'When this is what you need',
        html: `<p>A single API call often returns several attachments at once: a claim bundle with a form, an ID scan and a receipt; a report with a spreadsheet and a chart image. Copying one Base64 string at a time out of that JSON is tedious and error-prone, and the file names are lost along the way.</p>
        <div class="code-block">[{ "fileCode": "TD0101", "fileName": "report.pdf", "fileContent": "JVBERi..." }, ...]</div>`
      },
      {
        h2: 'Supported structures',
        html: `<ul>
          <li><strong>Arrays of objects</strong> with a file name field alongside the content field</li>
          <li><strong>Nested objects</strong> — the tool walks every level rather than only the top</li>
          <li><strong>Property names in any casing</strong> — <code>fileContent</code>, <code>file_content</code>, <code>content</code>, <code>base64</code>, <code>data</code></li>
        </ul>`
      },
      {
        h2: 'Different from decoding a single Base64 string',
        html: `<p>Plain decoding restores one file and has to guess the name. This mode treats the JSON as a container: it keeps each payload paired with its own <code>fileName</code>, so ten attachments come out as ten correctly named files. If the JSON is malformed — a copy that stopped mid-object — the tool still scans for Base64 shaped strings and recovers what it can.</p>`
      }
    ],
    faqs: [
      {
        q: 'Can it still extract when the JSON will not parse?',
        a: 'Yes. If a complete parse fails, the tool falls back to scanning for Base64-shaped strings and recovers those, then tells you that the source was incomplete so you know to grab a fresh copy.'
      },
      {
        q: 'Where do the file names come from?',
        a: 'From the name field next to each payload in the JSON. When there is none, the detected type from the file header is used to build a sensible name.'
      },
      {
        q: 'How many files can it extract at once?',
        a: 'There is no fixed limit — every Base64 payload in the response is extracted. The only ceiling is the overall input size of 100 MB.'
      }
    ]
  }
,

  'base64-to-text': {
    title: 'Base64 to Text Decoder — Read Base64 as Plain Text',
    desc: 'Decode Base64 into readable text, including UTF-8 and multibyte characters. Explains the three reasons decoded text comes out as mojibake, and how to tell text apart from a file payload.',
    h1: 'Base64 to Text Decoder',
    answer:
      'Paste Base64 and read the text it carries. UTF-8 support is built in, so accented characters, Chinese, Japanese and emoji survive the round trip — and when the output makes no sense as text, that itself is the clue that you are holding a file rather than a string.',
    mode: 'text',
    textDir: 'decode',
    sections: [
      {
        h2: 'How to use it: two steps',
        html: `<ol class="steps">
          <li><strong>Pick a direction</strong> — Base64 to text, or text to Base64</li>
          <li><strong>Paste</strong> — output follows as you type; there is no convert button</li>
        </ol>`
      },
      {
        h2: 'Decoded output looks like garbage? Three usual causes',
        html: `<ul>
          <li><strong>Wrong character set</strong> — the bytes are valid but were encoded in a legacy code page (GBK, Shift_JIS, Windows-1252) rather than UTF-8, so the characters render as symbols. <code>µ</code> and <code>©</code> are not the letters you typed.</li>
          <li><strong>It is not text at all</strong> — the payload is an image, PDF or archive, and what you are reading is compressed binary. Check for a file-header signature instead.</li>
          <li><strong>The source was mangled</strong> — a chat app or spreadsheet altered the string in transit, and the resulting bytes are no longer meaningful.</li>
        </ul>`
      },
      {
        h2: 'Where you run into Base64 text',
        html: `<ul>
          <li><strong>Tokens and cookies</strong> — small payloads decoded during debugging</li>
          <li><strong>API responses</strong> — string fields that arrive encoded rather than escaped</li>
          <li><strong>Logs and error reports</strong> — authentication headers and request bodies captured for analysis</li>
          <li><strong>Email headers</strong> — subject lines and display names encoded for transport</li>
        </ul>`
      }
    ],
    faqs: [
      {
        q: 'Why do accented characters or CJK text come out as question marks?',
        a: 'The bytes were not UTF-8 — usually a legacy code page such as GBK or Shift_JIS. The bytes themselves are intact, so decoding with the right character set recovers the text; the correct set is whichever one the producer documented.'
      },
      {
        q: 'Can I encode text to Base64 as well?',
        a: 'Yes, switch the direction at the top of the tool. Text mode also offers URL-safe output when the result has to survive a URL or a JWT.'
      },
      {
        q: 'The output looks like a file rather than text — what is it?',
        a: 'You are probably holding a file payload. Use <a href="/base64-to-file/">Base64 to file</a>, which reads the type from the file header instead of trying to render it as characters.'
      },
      {
        q: 'Is there a length limit?',
        a: 'Text mode is meant for short strings and stays smooth up to a few hundred thousand characters. For large payloads use the file mode, which processes on a background thread.'
      }
    ]
  },

  'base64-to-pptx': {
    title: 'Base64 to PPTX (PowerPoint) Converter — Decode Online',
    desc: 'Decode Base64 into a PowerPoint presentation. Recognizes .pptx from the OOXML archive, keeps slides, fonts and embedded media intact, and covers legacy .ppt files.',
    h1: 'Base64 to PPTX Converter',
    answer:
      'Paste the Base64 and get the presentation back. Slides, notes, embedded fonts and media are restored exactly — the bytes are not rewritten — so anything that opened the original file opens this one.',
    mode: 'to-file',
    sections: [
      {
        h2: 'Where Base64 presentations come from',
        html: `<ul>
          <li><strong>Deck-generation APIs</strong> — services that build a deck from a template and return it as a string</li>
          <li><strong>Collaboration tools</strong> — exports passed between automation steps</li>
          <li><strong>Backups</strong> — presentations stored as text in a database column</li>
        </ul>`
      },
      {
        h2: 'How a .pptx is recognized',
        html: `<p>The presentation is a ZIP archive: the decoded bytes start with <code>PK</code> and contain a <code>ppt/</code> directory, which is what distinguishes it from a .docx (<code>word/</code>) or .xlsx (<code>xl/</code>) built the same way.</p>`
      },
      {
        h2: 'Legacy .ppt files',
        html: `<p>PowerPoint 97-2003 used a binary format starting with <code>D0 CF 11 E0</code>. Those are restored as a generic compound document with a <code>.ppt</code> extension — the container is preserved, PowerPoint handles the rest.</p>`
      }
    ],
    faqs: [
      {
        q: 'Can it convert the deck to PDF or images?',
        a: 'No, the tool restores the original file rather than exporting from it. Open the restored deck in PowerPoint, LibreOffice or Keynote to export in another format.'
      },
      {
        q: 'Will WPS Presentation open the result?',
        a: 'Yes. WPS handles standard Office Open XML, and the file is byte-identical to the original.'
      }
    ]
  },

  base64url: {
    title: 'Base64URL Decoder — URL-safe Base64 Converter',
    desc: 'Decode and encode URL-safe Base64 (RFC 4648 §5): the - _ alphabet with padding stripped. Handles JWT segments, query parameters and filenames, and accepts both alphabets.',
    h1: 'Base64URL · URL-safe Base64',
    answer:
      'Paste either flavour and it decodes: standard Base64 or URL-safe, with or without padding. URL-safe swaps <code>+</code> and <code>/</code> for <code>-</code> and <code>_</code> and drops the trailing <code>=</code>, which is exactly the form JWT segments use.',
    mode: 'text',
    textDir: 'decode',
    sections: [
      {
        h2: 'Three characters differ from standard Base64',
        html: `<div class="simple-table"><table>
          <thead><tr><th>Standard</th><th>URL-safe</th><th>Why</th></tr></thead>
          <tbody>
            <tr><td><code>+</code></td><td><code>-</code></td><td>A plus in a query string decodes to a space</td></tr>
            <tr><td><code>/</code></td><td><code>_</code></td><td>A slash would look like a path separator</td></tr>
            <tr><td><code>=</code></td><td>omitted</td><td>Padding is redundant when the length is known</td></tr>
          </tbody>
        </table></div>`
      },
      {
        h2: 'When you must use it',
        html: `<ul>
          <li><strong>JWT</strong> — all three segments are Base64URL per RFC 7515</li>
          <li><strong>URL parameters and filenames</strong> — anywhere the string travels through a URL</li>
          <li><strong>Cookies and tokens</strong> — where a literal <code>+</code> or <code>/</code> would be re-interpreted</li>
        </ul>`
      },
      {
        h2: 'Decoding needs no manual edits',
        html: `<p>You do not have to convert <code>-</code> back to <code>+</code> or re-add padding first. The decoder recognises the URL-safe alphabet, normalises it and fills in the missing padding, then tells you which normalisation steps it took.</p>`
      }
    ],
    faqs: [
      {
        q: 'Can I decode a JWT segment directly?',
        a: 'Yes — a single segment, or the whole token. Pasting the full token gives you the header and payload laid out as readable JSON; see <a href="/jwt-decode/">JWT decoding</a>.'
      },
      {
        q: 'How do I output URL-safe Base64 when encoding?',
        a: 'Turn on the URL-safe option in text mode. The output uses <code>-</code> and <code>_</code> and omits padding, exactly as RFC 4648 §5 specifies.'
      },
      {
        q: 'Why does some Base64 end without the = signs?',
        a: 'Because it is the URL-safe variant, which drops padding by convention. The missing characters do not change the data — padding is derivable from the length.'
      },
      {
        q: 'Can the two alphabets be mixed?',
        a: 'They should not be. A string containing both <code>+</code> and <code>-</code> is malformed, and strict decoders reject it. This tool is lenient and normalises what it can, but producers should pick one alphabet and stay with it.'
      }
    ]
  },

  'base64-to-svg': {
    title: 'Base64 to SVG Converter — Decode Inline SVG Images',
    desc: 'Decode a Base64 SVG back into an editable vector file. Handles the data:image/svg+xml prefix, explains why SVG payloads are often not Base64 at all, and why external references break.',
    h1: 'Base64 to SVG Converter',
    answer:
      'Paste the Base64 and get the .svg file back. Vector source stays editable text, so opening the result in an editor gives you the paths, groups and attributes intact rather than a flattened image.',
    mode: 'to-file',
    sections: [
      {
        h2: 'Where Base64 SVG turns up',
        html: `<ul>
          <li><strong>Inline icons and logos</strong> — SVG embedded in CSS or HTML to remove a request</li>
          <li><strong>Generated charts</strong> — reports that render a vector chart and ship it as a string</li>
          <li><strong>Asset pipelines</strong> — icons bundled into a JSON theme file</li>
        </ul>`
      },
      {
        h2: 'What you can do with the restored file',
        html: `<p>An SVG is text, so once restored you can diff it, edit it by hand, run it through an optimiser, or paste it back inline. That is the practical difference from a raster image: the source remains inspectable.</p>`
      },
      {
        h2: 'Recognition relies on the declaration, not the extension',
        html: `<p>An SVG payload normally begins with <code>&lt;svg</code> or an XML declaration, and the data: prefix often reads <code>data:image/svg+xml;base64,</code>. Note that the prefix value can be SVG while the bytes are something else entirely if the producer mislabelled it — the header check catches that.</p>`
      }
    ],
    faqs: [
      {
        q: 'Can it handle inline SVG markup that is not Base64?',
        a: 'That markup is already text, so no decoding is needed — paste it into an editor directly. This page is for the Base64-encoded form.'
      },
      {
        q: 'Do external images and fonts referenced by the SVG come along?',
        a: 'No. Only the SVG file itself is inside the Base64 payload; anything it links to stays external. A vector that renders correctly elsewhere but looks broken standalone is usually missing those referenced assets.'
      },
      {
        q: 'Why does my restored SVG show as mojibake?',
        a: 'The bytes probably were not an SVG at all — the data: prefix said svg while the content was something else. Check the detected type reported by the tool.'
      }
    ]
  },

  'base64-to-mp3': {
    title: 'Base64 to MP3 Converter — Decode Base64 Audio',
    desc: 'Decode a Base64 audio payload back into an MP3 file. Recognises audio from frame headers rather than the file name, and warns about payload size before you commit.',
    h1: 'Base64 to MP3 Converter',
    answer:
      'Paste the Base64 and download the audio file. The format is identified from the bytes themselves — an MP3 starts with an ID3 tag or a frame sync pattern — so a wrong or missing file name does not throw it off.',
    mode: 'to-file',
    sections: [
      {
        h2: 'Why audio is often shipped as Base64',
        html: `<ul>
          <li><strong>Voice-note and TTS APIs</strong> — synthesis endpoints commonly answer with a Base64 field</li>
          <li><strong>Messaging platforms</strong> — media relayed through JSON webhooks</li>
          <li><strong>Notification services</strong> — short alert sounds embedded in config</li>
        </ul>`
      },
      {
        h2: 'Recognition comes from the frame header',
        html: `<p>MP3 files begin with an <code>ID3</code> tag or a frame sync (<code>FF FB</code>, <code>FF F3</code> and similar). Other audio formats have their own signatures — <code>RIFF</code> for WAV, <code>OggS</code> for Ogg, <code>ftyp</code> for M4A. Checking those is why the download arrives with a usable extension.</p>`
      },
      {
        h2: 'A note on size',
        html: `<p>Audio grows fast under Base64: a 5 MB MP3 becomes about 6.7 MB of text, and the browser holds both copies while decoding. Voice notes are fine; full-length tracks are better handled as files.</p>`
      }
    ],
    faqs: [
      {
        q: 'Can it play the audio on the page?',
        a: 'This page restores the file for download. Once you have the MP3, any player will open it — the advantage here is getting the original bytes back rather than a re-encoded copy.'
      },
      {
        q: 'The decoded output is not an MP3 — why?',
        a: 'The payload is a different format, or the data was truncated. The tool reports the detected type from the header, which tells you which of the two it is.'
      },
      {
        q: 'Can it handle very large audio files?',
        a: 'Up to 100 MB of input. Beyond a few megabytes the decode runs on a background thread so the page keeps responding.'
      }
    ]
  },

  'base64-to-txt': {
    title: 'Base64 to TXT — Decode Base64 Text Files Online',
    desc: 'Decode Base64 into a text file you can download. Explains the difference from the text decoder, and the two reasons decoded text ends up as mojibake.',
    h1: 'Base64 to TXT Converter',
    answer:
      'Paste the Base64 and get a .txt file back. Use this page when you want the decoded content saved as a file; when you only want to read it on screen, the text decoder is quicker.',
    mode: 'to-file',
    sections: [
      {
        h2: 'Saving to .txt vs decoding to text',
        html: `<p>Both decode the same bytes; they differ in what you get. The <a href="/base64-to-text/">text decoder</a> shows the result inline for reading and copying. This page hands back a downloadable file, which is what you want when the payload is a log, a CSV or a config that needs to be opened elsewhere.</p>`
      },
      {
        h2: 'Not every Base64 payload is text',
        html: `<p>If the decoded bytes are an image, a PDF or an archive, saving them as .txt produces a file that no editor can render meaningfully. Check the detected type reported by the tool before saving: if it is not text, the matching page — <a href="/base64-to-pdf/">PDF</a>, <a href="/base64-to-image/">image</a> — is the right destination.</p>`
      },
      {
        h2: 'Two reasons decoded text becomes mojibake',
        html: `<ul>
          <li><strong>A legacy character set</strong> — the producer used GBK, Shift_JIS or Windows-1252 rather than UTF-8</li>
          <li><strong>A corrupted copy</strong> — an intermediary altered the string, so the bytes no longer represent the original text</li>
        </ul>`
      }
    ],
    faqs: [
      {
        q: 'Can I specify a legacy encoding such as GBK?',
        a: 'The decoder follows UTF-8, the overwhelmingly common choice and the standard for modern APIs. Bytes encoded in a legacy code page decode without error but render as symbols, which is your signal to convert with the correct set before decoding.'
      },
      {
        q: 'Will line breaks in the result be preserved?',
        a: 'Yes. Newlines carried inside the payload are decoded as-is, so logs and CSV rows keep their structure.'
      },
      {
        q: 'How large a payload is supported?',
        a: 'Up to 100 MB, with larger payloads processed on a background thread so the page stays responsive.'
      }
    ]
  },

  'data-url': {
    title: 'Data URL Generator & Parser — data: URI to File',
    desc: 'Build and parse data: URLs: turn a file into an inline data URI, or decode a data URL back into a file. Covers the three mistakes that break inline assets most often.',
    h1: 'Data URL Generator & Parser',
    answer:
      'A data: URL is a complete file inside a strings — MIME type, encoding and bytes together, ready to paste into HTML or CSS with no separate request. Paste one here and you get the original file back; drop a file in and you get a data: URL out.',
    mode: 'to-file',
    sections: [
      {
        h2: 'What a data: URL looks like',
        html: `<div class="code-block">data:[&lt;mediatype&gt;][;base64],&lt;data&gt;</div>
        <p>For example: <code>data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...</code>. Everything before the comma describes the payload; everything after is the content itself — Base64 for binary files, percent-encoded text otherwise.</p>`
      },
      {
        h2: 'When to use one, and when not to',
        html: `<p><strong>Good fit:</strong> small icons, one-off assets in an email template, a page that must render from a single self-contained file, a favicon that would otherwise cost a request.</p>
        <p><strong>Poor fit:</strong> anything large. A data URL cannot be cached separately from the document, it inflates the file by about 33 percent, and browsers re-parse it on every render.</p>`
      },
      {
        h2: 'Three mistakes that break inline assets',
        html: `<ul>
          <li><strong>Wrapping the line</strong> — a data URL must be one continuous string; a newline in the middle breaks it</li>
          <li><strong>Keeping the prefix when decoding</strong> — <code>data:image/png;base64,</code> is a marker, not data; the decoder strips it, but other tools will not</li>
          <li><strong>Forgetting the <code>;base64</code> marker</strong> — without it the payload is read as percent-encoded text, not binary, and the file is silently corrupted</li>
        </ul>`
      }
    ],
    faqs: [
      {
        q: 'Is a data: URL the same thing as Base64?',
        a: 'No — a data: URL is a container that may carry Base64. It wraps a MIME type around either Base64 content or percent-encoded text; the <code>;base64</code> marker is what tells the browser which.'
      },
      {
        q: 'What about data: URLs without the ;base64 marker?',
        a: 'Those hold percent-encoded text rather than binary. This tool recognises the form and attempts Base64 decoding anyway when the content looks like it, reporting what it did.'
      },
      {
        q: 'Which image formats can be previewed?',
        a: 'Any format your browser renders: PNG, JPEG, GIF, WebP and SVG are all supported, and the preview reflects the decoded bytes rather than a conversion.'
      }
    ]
  },

  'jwt-decode': {
    title: 'JWT Decoder — Read Header and Payload Safely',
    desc: 'Decode a JSON Web Token in the browser to read its header and payload. Shows issued-at and expiry as readable dates, and is explicit that decoding is not verification.',
    h1: 'JWT Decoder',
    answer:
      'Paste a token to read its header and payload as JSON. Nothing is uploaded, no signature check is attempted, and the tool keeps saying the thing that matters: reading a token proves nothing about whether it is authentic.',
    mode: 'text',
    textDir: 'decode',
    sections: [
      {
        h2: 'What the three parts are',
        html: `<ul>
          <li><strong>Header</strong> — the signing algorithm and token type, Base64URL encoded</li>
          <li><strong>Payload</strong> — the claims: subject, issuer, scopes, expiry and whatever else the issuer added</li>
          <li><strong>Signature</strong> — computed over the first two parts with the issuer's key; not data, and not decodable</li>
        </ul>`
      },
      {
        h2: 'Readable is not the same as trusted',
        html: `<p>Anyone can construct a token with any payload they like: change <code>"role":"user"</code> to <code>"role":"admin"</code>, re-encode, and hand it to a server that forgets to verify. Decoding is for inspection and debugging — never treat the contents as proof of anything until the signature has been checked server-side.</p>
        <p>Equally, a token being readable is not a flaw. Base64 is an encoding, not encryption; the security of a JWT comes from the signature and from keeping the transport encrypted.</p>`
      },
      {
        h2: 'When this is useful',
        html: `<ul>
          <li><strong>Debugging auth</strong> — checking whether a token carries the scope you expected</li>
          <li><strong>Expiry problems</strong> — reading <code>exp</code> and <code>iat</code> as actual timestamps</li>
          <li><strong>Integration work</strong> — confirming which claims an identity provider sends</li>
        </ul>`
      }
    ],
    faqs: [
      {
        q: 'Why does it say the format is wrong?',
        a: 'A JWT has exactly two dots and three Base64URL segments. Pasted HTML, a truncated token, or a <code>Bearer </code> prefix all fail that shape check.'
      },
      {
        q: 'Can the signature be decoded?',
        a: 'No — it is computed bytes, not encoded JSON. Verifying it requires the issuer key and a real library, which is a server-side job.'
      },
      {
        q: 'Does this verify signatures?',
        a: 'No, and no client-side tool should claim to. Verification needs the secret or public key, and doing it in a browser means handing over the key that protects the tokens.'
      }
    ]
  }
,

  privacy: {
    title: `Privacy Policy — ${'b64file'}`,
    desc: 'How this site handles your data: conversions run entirely in your browser, files are never uploaded, and only anonymous page-view statistics are collected.',
    h1: 'Privacy Policy',
    answer:
      'The short version: your files and the text you paste never leave your browser. There is no upload, no server-side processing and no account. The only data collected is anonymous page-view statistics.',
    mode: 'to-file',
    sections: [
      {
        h2: 'How the tool runs',
        html: `<p>Every conversion happens locally in JavaScript in your browser. Choosing a file, pasting Base64 and downloading a result involve no network request at all — you can disconnect from the internet after the page loads and the tool keeps working, which is the simplest possible proof.</p>`
      },
      {
        h2: 'What is collected',
        html: `<p>Nothing you paste. No file names, no file contents, no input strings, no results. The tool has no access to any of it beyond your own browser tab, and there is no backend that could store it.</p>`
      },
      {
        h2: 'Analytics',
        html: `<p>The site uses Google Analytics 4 to understand which pages are read and which are not. That means aggregated page views, an approximate country, browser and device type, and a randomly generated identifier stored in a cookie. This data is never linked to what you convert, because the conversion never reaches a server.</p>
        <p>You can block analytics entirely with an ad blocker, a privacy extension, or your browser's tracking protection without affecting the tool.</p>`
      },
      {
        h2: 'Cookies and third parties',
        html: `<p>The site itself sets no cookies beyond a local preference for light or dark mode, stored in <code>localStorage</code> and never transmitted. If advertising is added to the site, third-party vendors — including Google — may set cookies to serve ads based on prior visits; you can opt out of personalised advertising in <a href="https://myadcenter.google.com/" rel="noopener nofollow" target="_blank">Google Ads Settings</a> at any time, and the tool works exactly the same either way.</p>`
      },
      {
        h2: 'Security note',
        html: `<p>Base64 is an encoding, not encryption. It protects nothing: anyone holding an encoded string can read it back. Never encode passwords, API keys, private documents or other sensitive material and treat the result as safe.</p>`
      }
    ],
    faqs: [
      {
        q: 'Is anything kept after I close the page?',
        a: 'Only your light/dark preference in local storage. Converted files and pasted text exist in that tab\u2019s memory and disappear when the tab or browser closes.'
      }
    ]
  },

  about: {
    title: 'About — why this tool exists',
    desc: 'A browser-only Base64 tool built because decoding a raw Base64 string should not require finding out what the data is first. Local processing, no accounts, no uploads.',
    h1: 'About',
    answer:
      'This site exists because decoding Base64 is usually the last step of a frustrating afternoon: the string is truncated, the padding is gone, the prefix is still attached, and you have no idea what the file was supposed to be. The point here is to make that step trivial.',
    mode: 'to-file',
    sections: [
      {
        h2: 'Why build it',
        html: `<p>Most Base64 tools assume a clean input and a user who already knows the answer. Real inputs are messier: a value pasted out of an API response, an email attachment wrapped in awkward places, a token with the URL-safe alphabet, a file with no name. This tool assumes the input is messy and says plainly what it found.</p>`
      },
      {
        h2: 'Principles',
        html: `<ul>
          <li><strong>Local by default</strong> — nothing is uploaded, and it works offline once loaded</li>
          <li><strong>Say what happened</strong> — repairs are reported rather than applied silently; failures name the exact position</li>
          <li><strong>No account, no wall</strong> — no sign-up, no quota, no upsell</li>
          <li><strong>Honest about limits</strong> — truncated data cannot be recovered, and the tool tells you so instead of guessing</li>
        </ul>`
      },
      {
        h2: 'How it is built',
        html: `<p>A static site: plain HTML, CSS and TypeScript, no framework, no backend. Every page is generated at build time with its own title, description and structured data, and the conversion logic is covered by an automated test suite. Because there is no server work, there is nothing to queue behind and nothing to leak.</p>`
      },
      {
        h2: 'Feedback',
        html: `<p>Bug reports, awkward inputs the tool handles badly and feature ideas are all welcome at <a href="mailto:${FEEDBACK_EMAIL}">${FEEDBACK_EMAIL}</a>. A real example that failed is worth more than a general suggestion.</p>`
      }
    ],
    faqs: [
      {
        q: 'Will it stay free?',
        a: 'Yes. There is no server cost to pass on and no paywall planned. If advertising is introduced later it will not affect what the tool does.'
      },
      {
        q: 'Who maintains it?',
        a: 'A small independent project. The aim is a tool that does one job properly rather than a suite of half-finished converters.'
      },
      {
        q: 'Are feature suggestions welcome?',
        a: 'Yes, especially when they come with the input that failed. Requests that fit the browser-only, no-upload design are the easiest to say yes to.'
      }
    ]
  },

  terms: {
    title: 'Terms of Service',
    desc: 'Terms for using this free Base64 tool: scope of service, disclaimer, acceptable use and intellectual property.',
    h1: 'Terms of Service',
    answer:
      'Short version: the tool is free, provided as-is, and you are responsible for what you process with it. Conversions happen in your browser, so no one else sees your data — or can help you recover it.',
    mode: 'to-file',
    sections: [
      {
        h2: 'Nature of the service',
        html: `<p>This site provides free online Base64 encoding, decoding and file conversion. Pages are static and all processing happens in your browser.</p>`
      },
      {
        h2: 'Disclaimer',
        html: `<p>Results are produced by an automated algorithm and are provided as-is, without warranty of any kind. The site is not liable for direct or indirect losses arising from use of the tool. Keep your own backups before working with important files.</p>`
      },
      {
        h2: 'Acceptable use',
        html: `<p>Do not use the tool to process illegal content, to create or distribute malicious files, or to infringe anyone's intellectual property. You are solely responsible for the material you handle.</p>`
      },
      {
        h2: 'Intellectual property',
        html: `<p>The page design and code of this site belong to its author. Content you process with the tool remains entirely yours — no rights are claimed over it.</p>`
      },
      {
        h2: 'Changes',
        html: `<p>These terms may be updated as the service changes; the current version on this page governs. Questions: <a href="mailto:${FEEDBACK_EMAIL}">${FEEDBACK_EMAIL}</a>.</p>`
      }
    ],
    faqs: [
      { q: 'Does the tool cost anything?', a: 'No. The core functionality is free, with no ads on the tool pages and no paywall.' }
    ]
  },

  '404': {
    title: `Page not found`,
    desc: 'That page does not exist or has moved.',
    h1: 'Page not found',
    answer: 'This address does not exist, or it has moved. The tools are all in the navigation above.',
    mode: 'to-file',
    sections: [],
    faqs: []
  },

  // Long-form guide pages live in their own module to keep this file readable.
  ...guidePages
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );
}

function siteUrl(): string {
  const nodeUrl = typeof process !== 'undefined' ? process.env.SITE_URL : '';
  const viteUrl = import.meta.env?.VITE_SITE_URL ?? '';
  return nodeUrl || viteUrl || DEFAULT_SITE_URL;
}

function absoluteUrl(path: string): string {
  const base = siteUrl().replace(/\/$/, '');
  return base ? `${base}${path}` : '';
}

const CONTENT_ONLY_PAGES = new Set(['privacy', 'about', 'terms', '404']);

export function renderShell(currentPage: PageId): string {
  const showTool = !CONTENT_ONLY_PAGES.has(currentPage);
  const d = pageData[currentPage] ?? pageData.home;
  const crumbs =
    currentPage !== 'home' && currentPage !== '404'
      ? `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">❯ Home</a> / <span>${d.h1}</span></nav>`
      : '';
  return `
    ${header(currentPage)}
    <main>
      ${crumbs}
      ${hero(currentPage)}
      ${showTool ? toolCard(currentPage) : ''}
      ${currentPage === 'home' ? toolsIndex() : ''}
      ${contentSections(currentPage)}
      ${d.faqs.length ? faqSection(currentPage) : ''}
      ${currentPage !== '404' ? relatedLinks(currentPage) : ''}
    </main>
    ${footer(currentPage)}
  `;
}

/** Main navigation (order is display order) */
const NAV_ITEMS: Array<{ path: string; label: string }> = [
  { path: '/base64-to-file/', label: 'Base64 to File' },
  { path: '/json-to-file/', label: 'JSON to Files' },
  { path: '/file-to-base64/', label: 'File to Base64' },
  { path: '/base64-to-image/', label: 'Base64 to Image' },
  { path: '/base64-decode-errors/', label: 'Decode errors' }
];

function header(currentPage: PageId): string {
  const currentPath = (pageRegistry as Array<{ id: string; path: string }>).find((p) => p.id === currentPage)?.path;
  const links = NAV_ITEMS.map((item) =>
    item.path === currentPath
      ? `<a href="${item.path}" class="active" aria-current="page">${item.label}</a>`
      : `<a href="${item.path}">${item.label}</a>`
  ).join('\n          ');
  return `
    <header class="site-header">
      <nav class="nav" aria-label="Main navigation">
        <a class="brand" href="/">
          <svg class="brand-icon" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="bg-lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d97757"/><stop offset="1" stop-color="#c15f3c"/></linearGradient></defs><rect width="64" height="64" rx="9" fill="url(#bg-lg)"/><text x="32" y="41.4" text-anchor="middle" font-family="'JetBrains Mono',ui-monospace,Consolas,monospace" font-size="23" font-weight="700" fill="#ffffff">b64</text></svg>
          <span class="brand-word"><span class="brand-mark">b64</span>file</span>
        </a>
        <div class="nav-links">
          ${links}
        </div>
        <div class="nav-side">
          <span class="local-chip" title="Works immediately — no sign-up or login">No login</span>
          <button id="theme-toggle" class="theme-toggle" type="button" aria-label="Switch colour theme">🌙</button>
        </div>
      </nav>
    </header>
  `;
}

function hero(page: PageId): string {
  const d = pageData[page] ?? pageData.home;
  return `
    <section class="hero hero-tight">
      <p class="hero-prompt" aria-hidden="true"><span class="prompt-sign">❯</span> paste --anything<span class="hero-cursor"></span><span class="prompt-comment"># processed on paste</span></p>
      <h1>${d.h1}</h1>
      <p class="answer">${d.answer}</p>
      ${d.quick?.length ? `<ul class="quick-list">${d.quick.map((q) => `<li>${q}</li>`).join('')}</ul>` : ''}
    </section>
  `;
}

function toolCard(page: PageId): string {
  const d = pageData[page] ?? pageData.home;
  return `
    <section class="tool-card" id="tool" data-default-mode="${d.mode}">
      <div class="term-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="term-title">b64file — converter · local</span></div>
      <div class="mode-tabs" role="tablist" aria-label="Conversion mode">
        <button class="mode-tab" data-mode="to-file" role="tab" type="button">Base64 to file</button>
        <button class="mode-tab" data-mode="to-base64" role="tab" type="button">File to Base64</button>
        <button class="mode-tab" data-mode="text" role="tab" type="button">Text encode / decode</button>
      </div>

      <div class="mode-panel" data-panel="to-file">
        <textarea id="b64-input" class="mono-input" rows="6" spellcheck="false" aria-label="Paste Base64 or file data"
          placeholder="Paste Base64, a data: URL, or an entire JSON response"></textarea>
        <div class="input-actions">
          <button id="b64-sample" class="ghost-btn" type="button">Load sample</button>
          <button id="b64-load-file" class="ghost-btn" type="button">Import .txt / .b64</button>
          <input type="file" id="b64-file-input" accept=".txt,.b64,.text,text/plain" hidden />
          <button id="b64-clear" class="ghost-btn" type="button">Clear</button>
        </div>
        <p class="input-hint">Processed as you paste — no button to press (Ctrl+Enter converts now / Esc clears)</p>
        <div id="b64-diagnosis" class="diagnosis" hidden></div>
        <div id="b64-result" class="result-area" hidden></div>
      </div>

      <div class="mode-panel" data-panel="to-base64" hidden>
        <div id="drop-zone" class="drop-zone">
          <div class="drop-icon">📄</div>
          <p><strong>Drop a file here</strong>, or <button id="pick-file" class="link-btn" type="button">choose one</button> — Ctrl+V a screenshot works too</p>
          <p class="muted">Any file type · 100 MB maximum</p>
          <input type="file" id="file-input" hidden />
        </div>
        <div id="file-info" hidden></div>
        <div id="encode-options" class="encode-options" hidden>
          <label><input type="checkbox" id="opt-urlsafe" /> URL-safe (- _ instead of + /, no padding)</label>
          <label><input type="checkbox" id="opt-dataurl" /> Include the data: prefix</label>
          <label><input type="checkbox" id="opt-wrap76" /> Wrap at 76 characters (MIME / PEM)</label>
        </div>
        <div id="encode-result" hidden></div>
      </div>

      <div class="mode-panel" data-panel="text" hidden>
        <div class="text-direction">
          <label><input type="radio" name="text-dir" value="encode"${d.textDir === 'decode' ? '' : ' checked'} /> Text → Base64</label>
          <label><input type="radio" name="text-dir" value="decode"${d.textDir === 'decode' ? ' checked' : ''} /> Base64 → Text</label>
        </div>
        <div class="encode-options" id="text-urlsafe-wrap"${d.textDir === 'decode' ? ' hidden' : ''}>
          <label><input type="checkbox" id="opt-text-urlsafe" /> URL-safe output (<code>-</code> <code>_</code> instead of <code>+</code> <code>/</code>, no padding)</label>
        </div>
        <textarea id="text-input" class="mono-input" rows="4" spellcheck="false" aria-label="Enter text or Base64"
          placeholder="Type text or paste Base64 — switch direction above"></textarea>
        <div id="text-output" class="text-output" hidden></div>
      </div>

      <p class="local-note">Paste, drag and drop, or Ctrl+V a screenshot</p>
    </section>
  `;
}

/** Titles for the homepage index groups (order = display order). */
const INDEX_GROUP_TITLE: Array<{ group: PageGroup; title: string }> = [
  { group: 'decode', title: 'Base64 to file' },
  { group: 'encode', title: 'File to Base64' },
  { group: 'text', title: 'Text and tokens' },
  { group: 'guide', title: 'Errors and guides' }
];

/**
 * Homepage tool index: every tool page as a plain static link, built once at build time.
 * Not a navigation nicety — crawlers need one hop from the homepage to every landing page,
 * and the header only ever linked five of them.
 */
function toolsIndex(): string {
  const ids = Object.keys(PAGE_GROUP).filter((id) => PAGE_GROUP[id] !== 'info' && PAGE_GROUP[id] !== 'home');
  const groups = INDEX_GROUP_TITLE.map(({ group, title }) => {
    const items = ids
      .filter((id) => PAGE_GROUP[id] === group && SHORT_LABEL[id])
      .map((id) => `<li><a href="${pagePaths[id] ?? '/'}">${SHORT_LABEL[id]}</a></li>`)
      .join('\n            ');
    return `<div class="tool-group">\n          <h3>${title}</h3>\n          <ul>\n            ${items}\n          </ul>\n        </div>`;
  }).join('\n        ');
  return `
    <section class="section tool-index">
      <h2>All ${ids.length} tools</h2>
      <p class="muted">One engine, four ways to use it. Free, no sign-up, and every file is decoded in your browser — nothing is uploaded.</p>
      <div class="tool-grid">
        ${groups}
      </div>
    </section>
  `;
}

function contentSections(page: PageId): string {
  const d = pageData[page] ?? pageData.home;
  if (!d.sections.length) return '';
  return d.sections
    .map((s, i) => `<section class="section"><span class="section-no">[${String(i + 1).padStart(2, '0')}]</span><h2>${s.h2}</h2>${s.html}</section>`)
    .join('\n');
}

function faqSection(page: PageId): string {
  const d = pageData[page] ?? pageData.home;
  return `
    <section class="section">
      <h2>Frequently asked questions</h2>
      ${d.faqs.map((f) => `<details><summary>${f.q}</summary><p class="muted">${f.a}</p></details>`).join('')}
    </section>
  `;
}

/** Short labels for navigation and related links (h1 is too long to use as anchor text) */
const SHORT_LABEL: Record<string, string> = {
  home: 'Home',
  'base64-to-file': 'Base64 to file',
  'file-to-base64': 'File to Base64',
  'base64-to-image': 'Base64 to image',
  'image-to-base64': 'Image to Base64',
  'base64-to-pdf': 'Base64 to PDF',
  'pdf-to-base64': 'PDF to Base64',
  'base64-to-word': 'Base64 to Word',
  'base64-to-excel': 'Base64 to Excel',
  'base64-to-pptx': 'Base64 to PPTX',
  'base64-to-text': 'Base64 to text',
  base64url: 'Base64URL',
  'json-to-file': 'JSON to files',
  'base64-to-svg': 'Base64 to SVG',
  'base64-to-mp3': 'Base64 to MP3',
  'base64-to-txt': 'Base64 to TXT',
  'data-url': 'Data URL',
  'jwt-decode': 'JWT decoder',
  'base64-decode-errors': 'Decode errors',
  'what-is-base64': 'What is Base64',
  'base64-vs-encryption': 'Base64 vs encryption',
  'how-to-decode-base64-in-javascript': 'Decode in JavaScript',
  about: 'About',
  privacy: 'Privacy',
  terms: 'Terms'
};

/**
 * Page groups. The whole site is one tool in three modes (Base64 → file, file → Base64,
 * text), and each page is a landing page for a different search phrase — so related links
 * take a few entries by relationship instead of listing all 19 pages.
 */
type PageGroup = 'decode' | 'encode' | 'text' | 'guide' | 'info' | 'home';
const PAGE_GROUP: Record<string, PageGroup> = {
  home: 'home',
  'base64-to-file': 'decode',
  'base64-to-image': 'decode',
  'base64-to-pdf': 'decode',
  'base64-to-word': 'decode',
  'base64-to-excel': 'decode',
  'base64-to-pptx': 'decode',
  'json-to-file': 'decode',
  'base64-to-svg': 'decode',
  'base64-to-mp3': 'decode',
  'base64-to-txt': 'decode',
  'data-url': 'decode',
  'base64-to-text': 'text',
  base64url: 'text',
  'jwt-decode': 'text',
  'file-to-base64': 'encode',
  'image-to-base64': 'encode',
  'pdf-to-base64': 'encode',
  'base64-decode-errors': 'guide',
  'what-is-base64': 'guide',
  'base64-vs-encryption': 'guide',
  'how-to-decode-base64-in-javascript': 'guide',
  about: 'info',
  privacy: 'info',
  terms: 'info'
};

const GROUP_LABEL: Record<string, string> = {
  decode: 'Also decoding Base64',
  encode: 'Also encoding to Base64',
  text: 'Also text and tokens',
  guide: 'Stuck on an error',
  info: 'Also on this site',
  home: 'Start here'
};

/**
 * Related links form a ring: pages are ordered by theme and each one links to the next five.
 * Outgoing links stay at ≤5 (never a link farm) while every page is linked by exactly five
 * others, so inbound links are constant too. The invariant is enforced by tests/pages.test.ts.
 */
const RELATED_GROUP_ORDER: PageGroup[] = ['decode', 'text', 'encode', 'guide', 'home', 'info'];

const RELATED_RING: string[] = RELATED_GROUP_ORDER.flatMap((gr) =>
  (pageRegistry as Array<{ id: string; hide?: boolean }>)
    .filter((p) => !p.hide && (PAGE_GROUP[p.id] ?? 'info') === gr)
    .map((p) => p.id)
);

function relatedLinks(currentPage: PageId): string {
  const byId = new Map(
    (pageRegistry as Array<{ id: string; path: string; hide?: boolean }>)
      .filter((p) => !p.hide)
      .map((p) => [p.id, p] as const)
  );
  const g = PAGE_GROUP[currentPage] ?? 'info';
  const ring = RELATED_RING;
  const i = ring.indexOf(currentPage);

  const picks: string[] = [];
  for (let k = 1; picks.length < 5 && k <= ring.length; k += 1) {
    const id = ring[(i + k) % ring.length];
    if (id !== currentPage) picks.push(id);
  }

  const labelFor = (tg: PageGroup): string => {
    if (tg === g) return GROUP_LABEL[g] ?? GROUP_LABEL.info;
    if ((g === 'decode' && tg === 'encode') || (g === 'encode' && tg === 'decode')) return 'The other direction';
    return GROUP_LABEL[tg] ?? GROUP_LABEL.info;
  };

  const rows = [g, ...RELATED_GROUP_ORDER.filter((x) => x !== g)]
    .map((tg) => [labelFor(tg), picks.filter((id) => (PAGE_GROUP[id] ?? 'info') === tg)] as const)
    .filter(([, items]) => items.length > 0);

  const body = rows
    .map(([label, items]) => {
      const out = items
        .map((id) => byId.get(id))
        .filter((p): p is { id: string; path: string } => Boolean(p))
        .map((p) => `<a href="${p.path}">${SHORT_LABEL[p.id] ?? p.id}</a>`)
        .join('');
      return `<div class="related-row"><span class="rg-label">${label}</span><div class="related-links">${out}</div></div>`;
    })
    .join('\n      ');

  return `
    <section class="section">
      <h2>Related tools and guides</h2>
      ${body}
    </section>
  `;
}

/** Footer cluster links: the two pages each group should send readers to next. */
const FOOTER_CLUSTER: Record<PageGroup, string[]> = {
  decode: ['/base64-to-pdf/', '/base64-to-word/'],
  encode: ['/pdf-to-base64/', '/image-to-base64/'],
  text: ['/base64url/', '/jwt-decode/'],
  guide: ['/base64url/', '/data-url/'],
  info: [],
  home: []
};

function footer(currentPage: PageId): string {
  const year = new Date().getFullYear();
  const host = siteUrl().replace(/^https?:\/\//, '').replace(/\/$/, '');
  // Legal pages are reachable from the home page only. Linking them from every page
  // spent a third of the site's internal links on pages that will never rank.
  const legal =
    currentPage === 'home'
      ? `<a href="/about/">About</a>
        <a href="/privacy/">Privacy</a>
        <a href="/terms/">Terms</a>`
      : `<span class="footer-legal">About · Privacy · Terms</span>`;
  const clusterRows: string[] = [];
  for (const path of FOOTER_CLUSTER[PAGE_GROUP[currentPage] ?? 'info'] ?? []) {
    const hit = pageRegistry.find((x) => x.path === path);
    if (hit && hit.id !== currentPage) {
      clusterRows.push(`<a href="${hit.path}">${SHORT_LABEL[hit.id] ?? hit.id}</a>`);
    }
  }
  const clusterLinks = clusterRows.join('\n        ');
  return `
    <footer class="footer">
      <div class="footer-brand">
        <svg class="brand-icon" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="bg-fg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d97757"/><stop offset="1" stop-color="#c15f3c"/></linearGradient></defs><rect width="64" height="64" rx="9" fill="url(#bg-fg)"/><text x="32" y="41.4" text-anchor="middle" font-family="'JetBrains Mono',ui-monospace,Consolas,monospace" font-size="23" font-weight="700" fill="#ffffff">b64</text></svg>
        <strong>${BRAND}</strong>
      </div>
      <p class="footer-tagline">Built out of love · free · no account · no uploads</p>
      <div class="statusbar"><span class="sb-left">${BRAND}</span><span class="sb-right">rfc4648 · 91 tests</span></div>
      <div class="footer-links">
        <a href="/">Home</a>
        <a href="/base64-to-file/">Base64 to file</a>
        <a href="/json-to-file/">JSON to files</a>
        <a href="/file-to-base64/">File to Base64</a>
        <a href="/base64-to-image/">Base64 to image</a>
        <a href="/base64-decode-errors/">Decode errors</a>
      </div>
      <div class="footer-links">
        ${legal}
        <a href="mailto:${FEEDBACK_EMAIL}">Feedback ${FEEDBACK_EMAIL}</a>
      </div>
      ${clusterLinks ? `<div class="footer-links">\n        ${clusterLinks}\n      </div>` : ''}
      <p class="muted">© ${year} ${host || BRAND} · Base64 is an encoding, not encryption — never use it to protect sensitive data</p>
    </footer>
  `;
}

export function metaTags(page: PageId): string {
  const d = pageData[page] ?? pageData.home;
  const canonical = absoluteUrl(pagePaths[page] ?? '/');
  const ogImage = absoluteUrl('/og-image.png');
  return `<title>${d.title}</title>
    <meta name="description" content="${d.desc}" />
    <meta name="applicable-device" content="pc,mobile" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:site_name" content="${BRAND}" />
    <meta property="og:title" content="${d.title}" />
    <meta property="og:description" content="${d.desc}" />
    <meta property="og:type" content="website" />
    ${canonical ? `<meta property="og:url" content="${canonical}" />` : ''}
    ${ogImage ? `<meta property="og:image" content="${ogImage}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />`;
}

export function canonicalTag(page: PageId): string {
  if (page === '404') return '';
  const url = absoluteUrl(pagePaths[page] ?? '/');
  return url ? `<link rel="canonical" href="${url}" />` : '';
}

/**
 * zh/en alternates. Google uses these to serve the right language version instead of
 * treating the two sites as duplicates, so keep them paired with the Chinese site.
 */
export function hreflangTags(page: PageId): string {
  if (page === '404') return '';
  const zhBase = ZH_SITE_URL.replace(/\/$/, '');
  const path = pagePaths[page] ?? '/';
  const en = absoluteUrl(path);
  const parts: string[] = [];
  if (en) parts.push(`<link rel="alternate" hreflang="en" href="${en}" />`);
  if (zhBase) parts.push(`<link rel="alternate" hreflang="zh-CN" href="${zhBase}${path}" />`);
  if (en && zhBase) parts.push(`<link rel="alternate" hreflang="x-default" href="${en}" />`);
  return parts.join('\n    ');
}

export function jsonLdScript(page: PageId): string {
  if (page === '404') return '';
  return `<script type="application/ld+json">${JSON.stringify(jsonLd(page))}</script>`;
}

function jsonLd(page: PageId): unknown[] {
  const d = pageData[page] ?? pageData.home;
  const path = pagePaths[page] ?? '/';
  const url = absoluteUrl(path) || path;
  const graph: unknown[] = [];

  if (page === 'home') {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: BRAND,
      url: absoluteUrl('/') || '/',
      inLanguage: 'en',
      description: 'Browser-only Base64 tools: decode Base64 to a file, encode files to Base64, and convert text both ways.'
    });
  }

  graph.push({
    '@context': 'https://schema.org',
    '@type': page === 'base64-decode-errors' ? 'Article' : 'WebApplication',
    name: d.h1,
    description: d.desc,
    url,
    inLanguage: 'en',
    ...(page === 'base64-decode-errors'
      ? { headline: d.h1 }
      : {
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Web browser',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
        })
  });

  if (page !== 'home') {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') || '/' },
        { '@type': 'ListItem', position: 2, name: d.h1, item: url }
      ]
    });
  }

  graph.push({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: d.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') }
    }))
  });

  return graph;
}
