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
  }
};
