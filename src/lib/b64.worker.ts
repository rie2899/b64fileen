import { decodeBase64ToBytes, encodeBytesToBase64 } from './base64';

type WorkerRequest =
  | { kind: 'encode'; bytes: Uint8Array; urlSafe?: boolean }
  | { kind: 'decode'; b64: string };

const ctx = self as unknown as {
  addEventListener(type: 'message', listener: (e: MessageEvent<WorkerRequest>) => void): void;
  postMessage(message: unknown, transfer?: Transferable[]): void;
};

ctx.addEventListener('message', (e) => {
  const req = e.data;
  if (req.kind === 'encode') {
    ctx.postMessage({ kind: 'encode', out: encodeBytesToBase64(req.bytes, { urlSafe: !!req.urlSafe }) });
  } else {
    const bytes = decodeBase64ToBytes(req.b64);
    ctx.postMessage({ kind: 'decode', bytes }, [bytes.buffer]);
  }
});
