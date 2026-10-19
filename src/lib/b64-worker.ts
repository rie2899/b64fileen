import { decodeBase64ToBytes, encodeBytesToBase64 } from './base64';

/**
 * Offload big encode/decode jobs to a worker so the page stays responsive.
 * Falls back to the main thread when Worker is unavailable (old browsers,
 * test environments) — callers get the same Promise either way.
 */

let worker: Worker | null = null;

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!worker) {
    worker = new Worker(new URL('./b64.worker.ts', import.meta.url), { type: 'module' });
  }
  return worker;
}

function postMessage<T>(data: unknown): Promise<T> {
  const w = getWorker();
  if (!w) return Promise.reject(new Error('worker unavailable'));
  return new Promise<T>((resolve, reject) => {
    const cleanup = () => {
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
    };
    const onMessage = (e: MessageEvent) => {
      cleanup();
      resolve(e.data as T);
    };
    const onError = () => {
      cleanup();
      reject(new Error('worker failed'));
    };
    w.addEventListener('message', onMessage);
    w.addEventListener('error', onError);
    w.postMessage(data);
  });
}

export function encodeBytesInWorker(bytes: Uint8Array, urlSafe: boolean): Promise<string> {
  if (typeof Worker === 'undefined') return Promise.resolve(encodeBytesToBase64(bytes, { urlSafe }));
  return postMessage<{ kind: 'encode'; out: string }>({ kind: 'encode', bytes, urlSafe }).then(
    (r) => r.out
  );
}

export function decodeBase64InWorker(b64: string): Promise<Uint8Array> {
  if (typeof Worker === 'undefined') return Promise.resolve(decodeBase64ToBytes(b64));
  return postMessage<{ kind: 'decode'; bytes: Uint8Array }>({ kind: 'decode', b64 }).then(
    (r) => r.bytes
  );
}
