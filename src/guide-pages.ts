import type { PageContent } from './static-pages';

/**
 * Informational pages. Chosen because each one answers a misunderstanding that tool
 * pages answer badly, which makes them the pages other sites are willing to cite.
 */
export const guidePages: Record<string, PageContent> = {
  'what-is-base64': {
    title: 'What Is Base64? Encoding Explained with a Worked Example',
    desc: 'Base64 turns binary data into plain ASCII text so it survives channels that mangle anything but text. How the 3-to-4 byte mapping works, why it adds 33 percent, and what it does not protect.',
    h1: 'What Is Base64?',
    answer:
      'Base64 is an encoding that rewrites binary data using only 64 printable ASCII characters. Three input bytes become four output characters, so the data grows by about 33 percent. It exists so that files and images can travel through systems that only accept text — email, JSON fields, URLs, config files. It is not encryption: anyone who sees a Base64 string can turn it back into the original bytes without a key.',
    mode: 'text',
    quick: [
      'Three bytes in, four characters out — roughly 33 percent larger',
      'The alphabet is <code>A-Z a-z 0-9 + /</code>, with <code>=</code> used only as padding at the end',
      'Reversible by anyone: no key, no password, no secret',
      'Standard Base64 is not URL-safe; the URL variant swaps <code>+</code> and <code>/</code> for <code>-</code> and <code>_</code>',
      'Paste a string into the tool above to see the original bytes or text'
    ],
    sections: [
      {
        h2: 'The problem it solves',
        html: `<p>Old mail protocols were designed for seven-bit ASCII. A single byte with the high bit set — anything from an image, a compressed archive, a PDF — could be corrupted or stripped by a mail server that was never built to carry it. Base64 was the workaround: map every possible byte value into a subset of characters that every system on the path already agrees on.</p>
        <p>The same constraint shows up today in places that are not email at all. A JSON body has to be valid text, so an API that accepts a file as a field encodes it first. A URL cannot carry arbitrary bytes safely, so signed parameters and tokens are encoded. A YAML file inside a Kubernetes manifest holds TLS material as Base64 so it stays one text value. None of these systems need secrecy — they need a form that survives copying.</p>`
      },
      {
        h2: 'How the mapping works',
        html: `<p>Take three bytes — 24 bits. Split them into four groups of six bits. Six bits gives 64 possible values, and 64 printable characters is exactly what the alphabet provides. So three bytes map onto four characters, and the decoder reverses it without ambiguity.</p>
        <p>A concrete example. The word <code>Man</code> is the bytes <code>4D 61 6E</code>, or in binary <code>01001101 01100001 01101110</code>. Regrouped into sixes: <code>010011</code> <code>010110</code> <code>0001</code><code>10</code> <code>101110</code> — that is 19, 22, 5, 46. In the standard alphabet those are <code>T</code>, <code>W</code>, <code>F</code>, <code>u</code>, so the encoded form is <code>TWFu</code>.</p>
        <p>Only the last group is ever incomplete. <code>Ma</code> is two bytes, 16 bits — enough for two full six-bit groups and a partial third. The encoder pads the missing positions with zero bits and marks how many bytes were missing with <code>=</code>, giving <code>TWE=</code>. A single byte becomes <code>TQ==</code>. That is why the length of a Base64 string is always a multiple of four, and why the number of trailing <code>=</code> tells you how much padding was added — a fact that makes truncated data easy to spot.</p>`
      },
      {
        h2: 'Why the output is about 33 percent larger',
        html: `<p>Four characters for every three bytes is a ratio of 4/3, so encoded data is 33 percent bigger than the input. A 3 MB PDF becomes roughly 4 MB of text. That growth is paid again wherever the string is copied: in the request body, in memory, in a database column, in a log line.</p>
        <p>This is the usual reason an upload fails with a size error even though the file itself is under the limit. The API limit applies to the encoded string, not the file. If you control both ends, send the file as multipart form data and skip the encoding entirely.</p>`
      },
      {
        h2: 'The variant most people trip over',
        html: `<p>Standard Base64 uses <code>+</code> and <code>/</code>. Both are meaningful inside a URL: <code>+</code> is read as a space in query strings, and <code>/</code> is a path separator. The URL-safe variant (Base64URL, defined in RFC 4648) replaces them with <code>-</code> and <code>_</code>, and usually drops the padding entirely. JWTs use this variant for all three segments.</p>
        <p>Mixing the two is the most common decoding failure there is: a string that looks perfectly valid but throws an error because it contains <code>-</code> where the standard decoder expects <code>+</code>. If a string refuses to decode, convert the alphabet first — see <a href="/base64url/">Base64URL</a>.</p>`
      },
      {
        h2: 'What Base64 is not',
        html: `<p>It is not encryption. There is no key, no nonce, no secret — the transformation is fixed and public. Anyone can decode a string in a browser console in one line. It is not compression either: it always makes data bigger, never smaller. And it is not a hash: a hash is one-way and fixed-length, while Base64 is fully reversible and keeps the original size relationship.</p>
        <p>Those distinctions matter in practice, because "it looks like gibberish" is not evidence of protection. If the data is a credential, a token or a private document, encoding it changes nothing about who can read it — see <a href="/base64-vs-encryption/">Base64 vs encryption</a>.</p>`
      }
    ],
    faqs: [
      {
        q: 'Can Base64 be decoded without the original key?',
        a: 'There is no key. Decoding needs only the alphabet and the padding rules, which are public. Treat any Base64 string as readable by anyone who receives it.'
      },
      {
        q: 'Why does my string end with = or ==?',
        a: 'Padding. Two bytes of input leave one character short of a group of four and get <code>=</code>; one byte leaves two short and gets <code>==</code>. If the input length is an exact multiple of three, there is no padding at all.'
      },
      {
        q: 'Is Base64 the same in every language?',
        a: 'The standard alphabet is. Implementations differ on how forgiving they are: most browsers and Node strip whitespace and accept missing padding, while stricter decoders reject both. When a string fails in one place and works in another, look at whitespace and padding first.'
      },
      {
        q: 'How large a file can I encode in a browser?',
        a: 'There is no fixed limit, but browser string handling gets expensive above a few megabytes and pointless above tens of megabytes. For anything large, encode in a worker, or send the file as multipart data instead.'
      }
    ]
  },

  'base64-vs-encryption': {
    title: 'Base64 vs Encryption: Why Encoding Is Not Protection',
    desc: 'Base64 and encryption both turn readable data into something unreadable-looking, and only one of them protects it. The difference in one test, the four places the confusion causes real leaks, and what to use instead.',
    h1: 'Base64 vs Encryption',
    answer:
      'Base64 is an encoding: a fixed, public transformation that anyone can reverse, with no key involved. Encryption is a transformation that requires a key to reverse, and is the only one of the two that hides data. They are often confused because both produce unreadable-looking text — and because encryption output is usually Base64-encoded so it can be stored as text. Encoding is how encrypted bytes travel; it is not what protects them.',
    mode: 'text',
    quick: [
      'Base64: reversible by anyone, no key, no secrecy',
      'Encryption: reversible only with the key, provides confidentiality',
      'The test: decode it. If the content appears, it was never protected',
      'Encrypted output is usually Base64-wrapped — that is packaging, not protection',
      'JWT payloads are Base64URL: readable by design, verify the signature instead'
    ],
    sections: [
      {
        h2: 'The one test that settles it',
        html: `<p>Paste the string into a decoder. If readable content comes out — a password, a JSON object, a message — the string was encoded, and every party that received it could do the same. If random bytes come out, it may have been encrypted, but that is not proof either unless you know what the plaintext should look like.</p>
        <p>This test is worth running on your own codebase. Strings that "look encrypted" are a common way for credentials to sit in a config file, a log or a database column for years while everyone assumes they are safe. The <a href="/base64-to-file/">decoder</a> does not ask for a password because there is none to ask for.</p>`
      },
      {
        h2: 'Why the confusion is so persistent',
        html: `<p>Encryption produces arbitrary bytes, and arbitrary bytes cannot be pasted into JSON, email or a config file. So encrypted output is almost always Base64-encoded before it is stored or transmitted. You see one layer and assume it is the protective one, when in fact the protection came from the layer underneath and the Base64 is only packaging.</p>
        <p>The reverse mistake is just as common: because Base64 changes the appearance of data, people assume it changed its accessibility. It did not. The mapping is a published table; a decoder is one line of JavaScript in any browser console.</p>`
      },
      {
        h2: 'Where this actually causes harm',
        html: `<p><strong>Credentials in config files.</strong> A database password wrapped in Base64 and committed to a repository is a plaintext password with extra steps. Secret scanners decode Base64 automatically before flagging it.</p>
        <p><strong>Tokens that look opaque.</strong> A JWT's payload segment is Base64URL — not encrypted. Anyone holding the token can read the claims: user id, roles, expiry, sometimes an email address. The signature proves the token was not modified, which is a different guarantee from confidentiality. If the claims must stay private, they belong in an encrypted layer or behind an API call.</p>
        <p><strong>Data at rest.</strong> A backup or an export encoded with Base64 passes a "not plaintext" glance and fails every real security review. Encoding survives no threat model at all: not a stolen disk, not a leaked bucket, not a curious support agent.</p>
        <p><strong>Compliance claims.</strong> Writing "data is encoded" in a policy document where a regulator expects encryption is a finding waiting to happen, and a hard one to argue once the timeline is reconstructed.</p>`
      },
      {
        h2: 'What actually protects data',
        html: `<p><strong>In transit</strong>, TLS. The bytes on the wire are encrypted by the connection, which is why the Base64 inside an HTTPS body adds nothing — and why the same body sent over plain HTTP is exposed regardless of how it is encoded.</p>
        <p><strong>At rest</strong>, authenticated encryption such as AES-GCM, with keys held in a key management service rather than in the same repository as the ciphertext. Authenticated matters: it detects tampering, which plain encoding and unauthenticated modes do not.</p>
        <p><strong>For passwords</strong>, neither. Passwords should be hashed with a slow, salted algorithm — bcrypt, scrypt or Argon2 — because you never need to read them back. Encrypting passwords is a design error that turns one key compromise into every user's password.</p>
        <p><strong>For integrity</strong>, a signature or an HMAC over the payload. That is what a JWT signature does, and it is the part you should be verifying.</p>`
      },
      {
        h2: 'The practical rule',
        html: `<p>Ask what the transformation is for. If the goal is "this must survive a channel that only carries text", use Base64. If the goal is "only the intended party may read this", use encryption with a managed key. If the goal is "this must not be reversible", use a hash. Choosing the wrong one is not a performance detail — each answers a different question.</p>`
      }
    ],
    faqs: [
      {
        q: 'Does Base64 offer any security benefit at all?',
        a: 'Only indirect ones. It prevents accidental interpretation of bytes — a binary blob pasted into a text field will not corrupt a parser — and it keeps some naive scanners from matching plaintext patterns. Neither is a control you can rely on.'
      },
      {
        q: 'If I Base64-encode an encrypted value twice, is that stronger?',
        a: 'No. Encoding layers are fully reversible and add nothing. Strength comes from key length, algorithm choice and key custody, not from how many times the output is reformatted.'
      },
      {
        q: 'Is a JWT encrypted?',
        a: 'By default, no — a JWS (the common JWT) is signed, not encrypted: the payload is readable and the signature prevents tampering. JWE is the encrypted form. If a token carries claims that must stay private, it needs JWE or server-side storage.'
      },
      {
        q: 'Can I tell encryption from encoding by looking at the string?',
        a: 'Not reliably. Both often look like Base64 because that is how binary is carried as text. The only dependable check is to try decoding it and see what comes out.'
      }
    ]
  },

  'how-to-decode-base64-in-javascript': {
    title: 'How to Decode Base64 in JavaScript (Browser and Node)',
    desc: 'atob, TextDecoder, Buffer and Base64URL — the correct decode call for browsers and Node, why atob mangles non-ASCII text, and how to turn a Base64 string back into a downloadable file.',
    h1: 'Decoding Base64 in JavaScript',
    answer:
      'In a browser, decode with <code>atob</code> for byte strings and <code>Uint8Array</code> plus <code>TextDecoder</code> when the content is UTF-8 — <code>atob</code> alone garbles non-ASCII text. In Node, use <code>Buffer.from(value, "base64").toString("utf8")</code>. For Base64URL, convert <code>-</code> and <code>_</code> back to <code>+</code> and <code>/</code> and restore the padding first.',
    mode: 'text',
    textDir: 'decode',
    quick: [
      'Browser, UTF-8: <code>new TextDecoder().decode(Uint8Array.from(atob(s), c \\u003d\\u003e c.charCodeAt(0)))</code>',
      'Node: <code>Buffer.from(s, "base64").toString("utf8")</code>',
      'Base64URL: replace <code>-</code> with <code>+</code>, <code>_</code> with <code>/</code>, then pad to a multiple of 4',
      '<code>atob</code> throws <code>InvalidCharacterError</code> on characters outside the alphabet',
      'Paste a string into the tool above to see the decoded text'
    ],
    sections: [
      {
        h2: 'Browser: the short version and its trap',
        html: `<p><code>atob()</code> decodes Base64 into a binary string — one character per byte. That is correct for binary data and wrong for text that is not pure ASCII, because most of the web is UTF-8 and a single accented character spans two bytes.</p>
        <pre><code>// Broken for non-ASCII: "café" comes back as "cafÃ©"
const text = atob(base64);

// Correct: bytes -> UTF-8
const bytes = Uint8Array.from(atob(base64), (c) =&gt; c.charCodeAt(0));
const text = new TextDecoder('utf-8').decode(bytes);</code></pre>
        <p>The reverse direction has the same gap. <code>btoa()</code> accepts only characters with codes below 256, so encoding a string containing "→" or an emoji throws. Encode the UTF-8 bytes first:</p>
        <pre><code>const bytes = new TextEncoder().encode(text);
let binary = '';
for (const byte of bytes) binary += String.fromCharCode(byte);
const base64 = btoa(binary);</code></pre>
        <p>The loop is deliberate. <code>String.fromCharCode(...bytes)</code> is shorter but spreads the whole array into arguments, and on a multi-megabyte payload that overflows the call stack.</p>`
      },
      {
        h2: 'Node and Bun',
        html: `<p><code>Buffer</code> handles both directions and assumes the encoding is UTF-8 for strings, which is what you want in almost every case:</p>
        <pre><code>const text = Buffer.from(base64, 'base64').toString('utf8');
const encoded = Buffer.from(text, 'utf8').toString('base64');</code></pre>
        <p>If you need the raw bytes rather than a string — writing a decoded image to disk, say — stop at <code>Buffer.from(base64, 'base64')</code> and pass that to <code>fs.writeFile</code>. Decoding to a string first and re-encoding would corrupt anything that is not valid UTF-8.</p>
        <p>Bun implements <code>Buffer</code> and also ships <code>atob</code>/<code>btoa</code>, so browser code runs unchanged. Deno provides <code>atob</code>/<code>btoa</code> and <code>TextDecoder</code> globally as well; <code>Buffer</code> needs an import.</p>`
      },
      {
        h2: 'Base64URL, which is what tokens actually use',
        html: `<p>JWTs, OAuth state parameters and most signed URLs use the URL-safe alphabet: <code>-</code> and <code>_</code> instead of <code>+</code> and <code>/</code>, and padding stripped. A standard decoder rejects it, so normalise first:</p>
        <pre><code>function fromBase64Url(value) {
  const standard = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = standard + '='.repeat((4 - (standard.length % 4)) % 4);
  return padded;
}</code></pre>
        <p>Decoding a JWT payload is then three lines — and worth doing once on your own tokens to see what a reader can learn from them:</p>
        <pre><code>const payload = JSON.parse(
  new TextDecoder().decode(
    Uint8Array.from(atob(fromBase64Url(token.split('.')[1])), (c) =&gt; c.charCodeAt(0))
  )
);</code></pre>`
      },
      {
        h2: 'Turning Base64 back into a file',
        html: `<p>If the string is a data URL (<code>data:application/pdf;base64,JVBERi0...</code>), the browser can fetch it directly. If it is bare Base64, state the type yourself:</p>
        <pre><code>const res = await fetch('data:application/pdf;base64,' + base64);
const blob = await res.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'document.pdf';
a.click();
URL.revokeObjectURL(url);</code></pre>
        <p>Two details that bite: the MIME type in the data URL decides how the browser treats the download, and <code>revokeObjectURL</code> has to come after the click, not before. For a quick manual check of what is inside a string, the <a href="/base64-to-file/">Base64 to file</a> tool does the same thing without code.</p>`
      },
      {
        h2: 'When it throws',
        html: `<p><code>InvalidCharacterError</code> means the string contains characters outside the alphabet — usually a space, a newline, a smart quote pasted from a document, or the URL-safe characters in a standard decoder. Modern browsers strip ASCII whitespace, but they do not forgive the wrong alphabet.</p>
        <p>A decode that succeeds but produces garbled text is a different problem: it is almost always the UTF-8 issue from the first section, not corrupt data. A decode that succeeds but produces nothing useful usually means the string was truncated when it was copied — the length will not be a multiple of four. Both cases are covered in <a href="/base64-decode-errors/">common Base64 decode errors</a>.</p>`
      }
    ],
    faqs: [
      {
        q: 'Is atob deprecated?',
        a: 'No — it is still the standard browser API and fine for byte strings. The problem is only that it returns one character per byte, which is not how text works. Pair it with <code>TextDecoder</code> and it is correct.'
      },
      {
        q: 'Why does atob exist if Buffer is simpler?',
        a: '<code>Buffer</code> is a Node API. Browsers have no <code>Buffer</code>, and bundling a polyfill for a single decode ships kilobytes to do what two native calls already do.'
      },
      {
        q: 'Can I decode a whole large file in the browser?',
        a: 'Not comfortably in one string. Above a few megabytes, decode in a Web Worker so the main thread stays responsive, and work with <code>Blob</code>/<code>ArrayBuffer</code> rather than building giant JavaScript strings.'
      },
      {
        q: 'Does decoding Base64 tell me what the file type is?',
        a: 'Only if you look at the first bytes. A PDF starts with <code>%PDF</code>, a PNG with the byte sequence <code>89 50 4E 47</code>, a ZIP-based format such as DOCX with <code>PK</code>. The Base64 text itself carries no type information unless it is wrapped in a data URL.'
      }
    ]
  },

  'base64-to-webp': {
    title: 'Base64 to WebP — Decode a Base64 WebP Image Online',
    desc: 'Paste Base64 WebP data and get a .webp file back. Spots the RIFF/WEBP header, strips the data:image/webp prefix, recovers truncated copies, and warns when inlining the image is the wrong call.',
    h1: 'Base64 to WebP Converter',
    answer:
      'Paste Base64 and get a WebP image back. The tool checks the RIFF header and the WEBP marker at byte 8 before handing the file over, so a truncated or mislabelled string is reported instead of being saved as a broken image. A data:image/webp;base64, prefix is stripped automatically.',
    mode: 'to-file',
    quick: [
      'WebP files start with <code>RIFF</code> and carry <code>WEBP</code> at byte 8',
      'A <code>data:image/webp;base64,</code> prefix is not part of the data',
      'Base64 adds about 33 percent on top of the image size',
      'Files are decoded in the browser — nothing is uploaded',
      'For images over ~10 KB, serve the .webp file instead of inlining it'
    ],
    sections: [
      {
        h2: 'Where Base64 WebP turns up',
        html: `<ul>
          <li><strong>CSS data URIs</strong> — <code>background-image: url("data:image/webp;base64,...")</code> in a build step that inlines small assets</li>
          <li><strong>JSON from an image pipeline</strong> — resizing and conversion services often return the result as a Base64 field</li>
          <li><strong>Single-file HTML exports</strong> — a report or a demo saved as one shareable file has to carry its images as text</li>
          <li><strong>API previews</strong> — a thumbnail field next to the real download URL</li>
        </ul>`
      },
      {
        h2: 'How the tool knows it is WebP',
        html: `<p>A WebP file is a RIFF container: the first four bytes are <code>RIFF</code>, four bytes of length follow, then <code>WEBP</code> at offset 8. The decoder checks both positions. That matters because a JPEG or PNG pasted as "webp" decodes perfectly well as bytes — the file only fails when a browser refuses to render it.</p>
        <p>If the string starts with <code>data:image/webp;base64,</code>, the prefix is removed before decoding. If the length is not a multiple of four, the data was almost certainly cut off in transit — the tool reports that rather than writing a file that will not open.</p>`
      },
      {
        h2: 'When inlining is the right call — and when it is not',
        html: `<p>Inlining removes one HTTP request, which is worth something for a small icon or a logo that appears above the fold. Past roughly 10 KB it stops being a win: the Base64 text is 33 percent larger than the binary, it cannot be cached separately, and it blocks the CSS or HTML that carries it. Google's own guidance is to inline only assets small enough that the request cost exceeds the transfer cost.</p>
        <p>WebP makes the trade better than PNG did, because the same picture is typically 25–35 percent smaller to begin with. But the same rule applies: a hero image belongs in a file with a cacheable URL, not in a data URI.</p>`
      },
      {
        h2: 'After you have the file',
        html: `<p>Save the <code>.webp</code> and reference it by URL. Every current browser supports WebP; the format only needs a fallback if you still support very old Safari, and even there the practical answer is <code>&lt;picture&gt;</code> with a JPEG source rather than an inline fallback.</p>
        <p>To go the other direction, use <a href="/image-to-base64/">image to Base64</a>. To check what a string actually contains when the type is unknown, paste it into the <a href="/base64-to-file/">general decoder</a> — it identifies the format from the header bytes.</p>`
      }
    ],
    faqs: [
      {
        q: 'Why does my file open as a blank image?',
        a: 'Either the data was truncated (check that the length is a multiple of four) or the bytes are not actually WebP despite the label. Decode it and look at the first four bytes: <code>RIFF</code> means WebP or WAV, and only the marker at offset 8 tells you which.'
      },
      {
        q: 'Is a Base64 WebP bigger than the original?',
        a: 'Yes — about 33 percent larger. Four characters encode three bytes, always. The image itself is not re-encoded, so quality is untouched.'
      },
      {
        q: 'Can I convert WebP to PNG here?',
        a: 'Not directly. This tool restores the original bytes. To change format, decode to <code>.webp</code> first and convert with an image editor or a command-line tool such as <code>cwebp</code>/<code>dwebp</code>.'
      }
    ]
  },

  'base64-to-woff2': {
    title: 'Base64 to WOFF2 — Decode a Base64 Font File',
    desc: 'Turn Base64 font data back into a .woff2 file. Detects the wOF2 signature, separates WOFF from WOFF2 and TTF, and explains why inlining fonts in CSS is usually a mistake.',
    h1: 'Base64 to WOFF2 Converter',
    answer:
      'Paste Base64 and get the font file back. WOFF2 files begin with the four bytes <code>wOF2</code>, WOFF with <code>wOFF</code> — the tool reads that signature, so you find out immediately whether the string is really WOFF2, an older WOFF, or a raw TrueType file with the wrong label.',
    mode: 'to-file',
    quick: [
      'WOFF2 starts with <code>wOF2</code>; WOFF starts with <code>wOFF</code>',
      'Both are compressed containers — the decoded file is not a plain font table dump',
      '<code>data:font/woff2;base64,</code> prefixes are stripped automatically',
      'Inlining a full font in CSS blocks rendering and defeats caching',
      'Check the font licence before embedding it anywhere'
    ],
    sections: [
      {
        h2: 'Where Base64 WOFF2 appears',
        html: `<ul>
          <li><strong>CSS <code>@font-face</code> blocks</strong> — the classic <code>src: url(data:font/woff2;base64,...)</code> pattern, usually produced by a build tool or copied from a font CDN</li>
          <li><strong>Single-file HTML</strong> — an offline demo or a design mockup that must render identically with no external requests</li>
          <li><strong>Email templates</strong> — where external font files are blocked, so some senders inline them (rarely a good idea, see below)</li>
          <li><strong>App bundles and config files</strong> — a mobile build that ships one font as a JSON string field</li>
        </ul>`
      },
      {
        h2: 'The four signatures worth knowing',
        html: `<p>The first four bytes tell you what you have, and they are easy to confuse:</p>
        <ul>
          <li><code>wOF2</code> — WOFF2, Brotli-compressed, the format you actually want on the web</li>
          <li><code>wOFF</code> — WOFF 1, zlib-compressed, the older format</li>
          <li><code>OTTO</code> — OpenType with CFF outlines (often a <code>.otf</code>)</li>
          <li><code>00 01 00 00</code> or <code>true</code> — raw TrueType</li>
        </ul>
        <p>A string labelled "woff2" that starts with <code>00 01 00 00</code> is a plain TTF: it will still work in a browser, but it is several times larger than the same font recompressed to WOFF2.</p>`
      },
      {
        h2: 'Why inlining a font is usually wrong',
        html: `<p>A font file is the largest thing most sites inline. A single Latin subset is 15–30 KB; a full family can be hundreds. Base64 adds another 33 percent, the CSS that carries it cannot finish downloading until the whole string has arrived, and because the data lives inside the stylesheet it is re-sent with every cache miss on that stylesheet instead of being cached as its own file.</p>
        <p>The exceptions are narrow: a tiny icon font under a few KB, or a genuinely single-file artifact that must work offline. Everything else is better as a separate <code>.woff2</code> with <code>font-display: swap</code> and a long cache header.</p>`
      },
      {
        h2: 'Licensing is the part people skip',
        html: `<p>Most commercial fonts are licensed per use, and embedding the file in CSS is a distribution. Open-licensed fonts (OFL, Apache) permit it with attribution rules; paid desktop licences often do not cover web embedding at all. If the Base64 came from a template or a purchased theme, the licence travels with the font file, not with the CSS you found it in.</p>
        <p>To encode a font you own, use <a href="/file-to-base64/">file to Base64</a>. To identify an unknown Base64 blob, the <a href="/base64-to-file/">general decoder</a> reads the header for you.</p>`
      }
    ],
    faqs: [
      {
        q: 'The decoded file will not load as a font — why?',
        a: 'Check the signature first. A <code>.woff2</code> extension on a file that starts with <code>00 01 00 00</code> is a TTF, and some servers refuse to serve it under the wrong MIME type. Rename it to .ttf, or recompress it to WOFF2.'
      },
      {
        q: 'Can I convert WOFF2 back to TTF here?',
        a: 'No — this page restores the bytes exactly as they were encoded. WOFF2 is a Brotli-compressed wrapper, so converting it to TTF needs a font tool such as <code>woff2_decompress</code> or <code>fonttools</code>.'
      },
      {
        q: 'Does Base64 change the font quality?',
        a: 'No. Encoding is lossless and reversible; the bytes are identical. Only the size changes, upward by about a third.'
      }
    ]
  },

  developers: {
    title: 'Developers — Run Base64 Conversion Without a Server',
    desc: 'Copy-paste Base64 code for browsers, workers and Node, plus magic-byte detection. Everything on this site runs client-side: no upload, no API key, no rate limit.',
    h1: 'For Developers',
    answer:
      'Everything on this site runs in the browser: files are decoded locally and never uploaded, so there is no API key, no rate limit and nothing to sign up for. Below are the exact calls the tool uses — copy them into your own project, or open DevTools on any page here and read the source.',
    mode: 'text',
    quick: [
      'No upload: the file never leaves the machine it is opened on',
      'No API key, no quota, no account',
      'Browser text: <code>TextDecoder</code> over <code>atob</code> bytes — not bare <code>atob</code>',
      'Node: <code>Buffer.from(value, "base64")</code>',
      'Type detection: read the magic bytes, do not trust the extension'
    ],
    sections: [
      {
        h2: 'Decode text (browser)',
        html: `<pre><code>function decodeBase64Text(value) {
  const clean = value.replace(/^data:[^;]+;base64,/, '').replace(/\\s+/g, '');
  const standard = clean.replace(/-/g, '+').replace(/_/g, '/');
  const padded = standard + '='.repeat((4 - (standard.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(padded), (c) =&gt; c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}</code></pre>
        <p>Three details that break naive implementations: strip the <code>data:</code> prefix, normalise the URL-safe alphabet, restore the padding. Bare <code>atob</code> on UTF-8 text returns mojibake — see <a href="/how-to-decode-base64-in-javascript/">the JavaScript guide</a>.</p>`
      },
      {
        h2: 'Decode to bytes, not text',
        html: `<p>If the payload is a file, never go through a string. Convert straight to a typed array and build a Blob:</p>
        <pre><code>function decodeBase64Bytes(value) {
  const clean = value.replace(/^data:[^;]+;base64,/, '').replace(/\\s+/g, '');
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i &lt; bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

const blob = new Blob([bytes], { type: mime });
const url = URL.createObjectURL(blob);</code></pre>
        <p>In Node the same thing is one line: <code>Buffer.from(value, 'base64')</code> — and pass that buffer straight to <code>fs.writeFile</code>, without a UTF-8 round trip.</p>`
      },
      {
        h2: 'Detect the file type from magic bytes',
        html: `<p>An extension is a claim; the first bytes are evidence. This is the check this site runs before it offers a download:</p>
        <pre><code>const SIGNATURES = [
  { mime: 'image/png',  ext: 'png',  bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/jpeg', ext: 'jpg',  bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/webp', ext: 'webp', bytes: [0x52, 0x49, 0x46, 0x46], also: { at: 8, bytes: [0x57, 0x45, 0x42, 0x50] } },
  { mime: 'application/pdf', ext: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: 'font/woff2', ext: 'woff2', bytes: [0x77, 0x4f, 0x46, 0x32] },
  { mime: 'application/zip', ext: 'zip', bytes: [0x50, 0x4b, 0x03, 0x04] }
];

function matches(bytes, sig) {
  if (!sig.every((b, i) =&gt; bytes[i] === b)) return false;
  if (!sig.also) return true;
  return sig.also.bytes.every((b, i) =&gt; bytes[sig.also.at + i] === b);
}

const type = SIGNATURES.find((s) =&gt; matches(bytes, s.bytes)) ?? null;</code></pre>
        <p>WebP is the one that needs the second check: <code>RIFF</code> alone could be WAV or AVI, and only the marker at offset 8 tells them apart.</p>`
      },
      {
        h2: 'Large files without freezing the page',
        html: `<p>Decoding happens on the main thread unless you move it. For files above a few megabytes, a worker keeps the UI responsive:</p>
        <pre><code>const worker = new Worker('/b64-worker.js');
worker.postMessage({ base64 });
worker.onmessage = (e) =&gt; {
  const bytes = new Uint8Array(e.data.buffer);
  // ...
};</code></pre>
        <p>Two more traps: <code>String.fromCharCode(...bytes)</code> overflows the argument limit on large inputs (loop instead), and <code>FileReader.readAsDataURL</code> is convenient but materialises the whole Base64 string in memory — for very large files, read as an <code>ArrayBuffer</code> and encode in chunks.</p>`
      },
      {
        h2: 'What this site does and does not offer',
        html: `<p><strong>Offers</strong>: client-side conversion for any file up to 100 MB, the same code paths documented above, and a documented list of what it recognises — see the <a href="/base64-to-file/">decoder</a>.</p>
        <p><strong>Does not offer</strong>: a hosted HTTP API. There is no endpoint to call, because the design goal is that your file never leaves your machine. If you need server-side conversion, the functions above run unchanged in Node, Bun or a Cloudflare Worker.</p>`
      }
    ],
    faqs: [
      {
        q: 'Is there a JSON API endpoint?',
        a: 'No. Adding one would mean uploading the file to a server, which is the thing this site exists to avoid. The code on this page can be deployed to your own worker in an afternoon.'
      },
      {
        q: 'Can I use these snippets commercially?',
        a: 'Yes — they are ordinary standard-library calls with no licensing attached. Attribution is not required.'
      },
      {
        q: 'Why does the tool cap files at 100 MB?',
        a: 'Browser memory. The Base64 string, the decoded bytes and the Blob can coexist briefly, so a 100 MB file can need several hundred megabytes of headroom while it is being processed.'
      },
      {
        q: 'How do I know nothing is uploaded?',
        a: 'Open DevTools → Network, switch to the Fetch/XHR filter and paste a file. No request carries the payload. The site is a static bundle; there is no backend to receive it.'
      }
    ]
  },
  'base64-data-uri-pitfalls': {
    title: 'Five Things That Break When You Inline Base64 (and How to Check Each One)',
    desc: 'Data URIs look like a free optimisation and are usually not. Five failure modes — the 33% tax, MIME mismatches, truncation, UTF-8 mojibake and CSP — with the check that catches each one.',
    h1: 'Five Ways Inlined Base64 Breaks',
    answer:
      'Inlining Base64 fails in five predictable places: the payload is a third larger than the file it replaces and stops being cacheable; the declared MIME type overrides the real bytes; line breaks and stripped padding break the decode; <code>atob</code> mangles anything that is not Latin-1; and a Content-Security-Policy without <code>data:</code> blocks the resource silently. Each has a one-line check.',
    mode: 'text',
    quick: [
      'Base64 is 33 percent larger and cannot be cached separately from the file that carries it',
      'Browsers trust the MIME type in the data URI — not the bytes behind it',
      'Whitespace inside the string and missing <code>=</code> padding both throw',
      '<code>btoa</code> throws on any character above U+00FF; <code>atob</code> returns mojibake for UTF-8',
      'CSP needs <code>img-src data:</code> or <code>font-src data:</code> — otherwise it fails with no error'
    ],
    sections: [
      {
        h2: '1. The 33 percent tax, and the cache you lose',
        html: `<p>Four Base64 characters carry three bytes, so every inlined asset is about a third larger than the file. That alone is survivable. The real cost is that the payload now lives inside your CSS or HTML: it is re-sent whenever that file is not cached, it cannot be cached on its own, and it blocks the document behind it.</p>
        <p>A 30 KB font inlined in the main stylesheet turns a 40 KB CSS file into an 80 KB one that must arrive in full before anything renders. The same font as a separate file downloads in parallel and is cached for a year.</p>
        <p><strong>Check:</strong> compare gzipped transfer size of "CSS with the asset inlined" against "CSS + separate file" in DevTools → Network, with cache disabled. Below roughly 2–3 KB the inline wins; above 10 KB it almost never does.</p>`
      },
      {
        h2: '2. The declared MIME type overrides the real bytes',
        html: `<p>A data URI states its type: <code>data:image/png;base64,...</code>. The browser believes that label. Encode a WebP, label it PNG, and Chrome renders nothing — with no console error, because as far as the parser is concerned the image is simply corrupt.</p>
        <p>Fonts are worse, because the failure is silent in a different way: a TrueType file served as <code>font/woff2</code> may load in one browser and be rejected in another.</p>
        <p><strong>Check:</strong> read the first bytes before trusting the label — <code>89 50 4E 47</code> is PNG, <code>RIFF….WEBP</code> is WebP, <code>wOF2</code> is WOFF2, <code>00 01 00 00</code> is raw TrueType. The <a href="/base64-to-file/">decoder</a> here does exactly that check and names the format it finds.</p>`
      },
      {
        h2: '3. Whitespace and stripped padding',
        html: `<p>Base64 that has travelled through email, a YAML file or a chat window often carries line breaks every 76 characters. <code>atob</code> throws on those. The same string with newlines removed may then fail because padding was stripped to save two bytes, and the length is no longer a multiple of four.</p>
        <pre><code>const clean = value.replace(/^data:[^;]+;base64,/, '').replace(/\\s+/g, '');
const standard = clean.replace(/-/g, '+').replace(/_/g, '/');
const padded = standard + '='.repeat((4 - (standard.length % 4)) % 4);</code></pre>
        <p><strong>Check:</strong> strip whitespace, normalise the URL-safe alphabet, restore padding — in that order. If it still throws, the string was truncated in transit; a length that is not a multiple of four after cleaning is the tell.</p>`
      },
      {
        h2: '4. UTF-8: btoa throws, atob mangles',
        html: `<p><code>btoa</code> accepts only characters U+0000–U+00FF. Pass it anything with an accent, an emoji or a Chinese character and it throws <code>InvalidCharacterError</code>. Go the other way and <code>atob</code> happily returns a "string" that is really raw bytes, so <code>é</code> and 中文 arrive as mojibake.</p>
        <pre><code>// encode
const bytes = new TextEncoder().encode(text);
const b64 = btoa(String.fromCharCode(...bytes)); // loop for large input

// decode
const out = new TextDecoder('utf-8').decode(
  Uint8Array.from(atob(b64), (c) =&gt; c.charCodeAt(0))
);</code></pre>
        <p><strong>Check:</strong> round-trip a string containing an emoji and a CJK character. If either comes back changed, the code is treating bytes as Latin-1 text.</p>`
      },
      {
        h2: '5. Content-Security-Policy blocks it silently',
        html: `<p>A policy written as <code>img-src 'self'</code> blocks every <code>data:</code> image, and <code>font-src 'self'</code> blocks inlined fonts. The browser reports a CSP violation in the console and renders nothing else — which is easy to miss in a build where the CSS came from a bundler and nobody wrote a data URI by hand.</p>
        <p><strong>Check:</strong> open the console and filter for "Refused to load". If your build step inlines assets, the policy needs <code>data:</code> in <code>img-src</code>, <code>font-src</code> and sometimes <code>style-src</code>.</p>`
      },
      {
        h2: 'The checklist before you inline anything',
        html: `<ul>
          <li>Under 3 KB and used once on the page? Inline it.</li>
          <li>Over 10 KB, or reused across pages? Serve it as a file with a cache header.</li>
          <li>Does the declared MIME type match the first bytes? Verify, do not assume.</li>
          <li>Did the string survive transport? Strip whitespace, restore padding, check <code>length % 4</code>.</li>
          <li>Does any text pass through <code>atob</code>/<code>btoa</code>? Use <code>TextEncoder</code>/<code>TextDecoder</code>.</li>
          <li>Does the CSP allow <code>data:</code> for that resource type?</li>
          <li>Is the asset a font? Check the licence before embedding it at all.</li>
        </ul>`
      }
    ],
    faqs: [
      {
        q: 'Is inlining Base64 ever faster?',
        a: 'Yes, for small assets used immediately above the fold, where removing one request matters more than the extra bytes. The break-even is usually between 2 and 4 KB gzipped; measure it rather than guessing.'
      },
      {
        q: 'Why does my image data URI render as a broken icon?',
        a: 'Usually a MIME mismatch or a truncated string. Check the first bytes and the length — both are covered by the <a href="/base64-to-file/">general decoder</a>.'
      },
      {
        q: 'Does a data URI affect SEO?',
        a: 'Indirectly. It increases HTML size and blocks rendering, both of which show up in Core Web Vitals. Search engines have no problem reading data URIs, but they cannot index an inlined image as its own asset.'
      }
    ]
  }
};
