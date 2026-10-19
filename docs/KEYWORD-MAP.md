# Page and keyword map

Every page is a landing page for one search intent. Titles were written for English
demand — **not translated** from the Chinese pages, because the two markets search
differently (a Chinese "Base64 转文件" query has no direct English equivalent).

## Pages currently built

| Page | Primary target | Secondary | Chinese counterpart |
| --- | --- | --- | --- |
| `/` | base64 converter online | base64 to file, file to base64, decode base64 | 首页 |
| `/base64-to-file/` | base64 to file | decode base64 to file, base64 decoder online | base64-to-file |
| `/file-to-base64/` | file to base64 | convert file to base64 online, encode file to base64 | file-to-base64 |
| `/base64-to-image/` | base64 to image | base64 to png, base64 image decoder | base64-to-image |
| `/image-to-base64/` | image to base64 | convert image to base64, image base64 data url | image-to-base64 |
| `/base64-to-pdf/` | base64 to pdf | decode base64 pdf online, base64 pdf converter | base64-to-pdf |
| `/pdf-to-base64/` | pdf to base64 | convert pdf to base64 online, encode pdf | pdf-to-base64 |
| `/base64-decode-errors/` | base64 decode error | invalid base64, base64 padding error, base64 length not multiple of 4 | 解码失败排查 |
| `/base64-to-word/` | base64 to word | decode base64 docx, base64 to docx | base64-to-word |
| `/base64-to-excel/` | base64 to excel | decode base64 xlsx, base64 to spreadsheet | base64-to-excel |
| `/base64-to-pptx/` | base64 to pptx | decode base64 powerpoint | base64-to-pptx |
| `/json-to-file/` | extract base64 from json | base64 from api response, json base64 decoder | json-to-file |
| `/base64-to-text/` | base64 to text | decode base64 to string, base64 text decoder | base64-to-text |
| `/base64url/` | base64url decode | url safe base64, base64 without padding | base64url |
| `/base64-to-svg/` | base64 to svg | decode svg data uri, svg base64 decoder | base64-to-svg |
| `/base64-to-mp3/` | base64 to mp3 | decode base64 audio, base64 to audio file | base64-to-mp3 |
| `/base64-to-txt/` | base64 to txt | decode base64 text file | base64-to-txt |
| `/data-url/` | data url generator | data uri to file, data url converter | data-url |
| `/jwt-decode/` | jwt decoder | decode jwt payload, jwt decoder online | jwt-decode |

`/base64-decode-errors/` is the odd one out on purpose: it is an informational page, it
answers a real problem ("why is my base64 invalid"), and informational pages earn links
far more easily than tool pages. That is what makes it worth having.

## Candidates for the next pages (ordered by expected value)

**Tool pages (highest intent, low competition):**

- `base64-to-png` / `base64-to-jpg` — people search the exact image format, and the
  existing image page is broader than the query
- `excel-to-base64` / `word-to-base64` — the encode direction for Office files, still missing
- `base64-to-zip`, `zip-to-base64` — archives, same pattern, one more format
- `csv-to-base64`, `base64-to-csv` — spreadsheets as text
- `mp3-to-base64` / `wav-to-base64` — the encode direction for audio
- `base64-size-calculator` — "how much bigger does base64 make a file", a recurring question
  with no good tool page answering it

**Guide pages (link magnets, and they feed the tool pages):**

- `how-to-decode-base64-in-javascript` — atob/btoa, Buffer, common pitfalls
- `base64-in-html-and-css` — data URIs, when to inline, performance trade-offs
- `what-is-base64` — the canonical explainer; every tool site eventually needs one
- `base64-vs-encryption` — "is base64 secure", high-volume misconception

## How to pick the next page

1. Ask Google Search Console: which queries already show this site but get no clicks?
2. Check that the intent is the same as an existing page's — if yes, improve that page
   instead of adding a near-duplicate (two pages chasing one query is worse than one).
3. Write the copy for the query, not the page count. A thin page that exists to fill a
   slot dilutes the whole site.
