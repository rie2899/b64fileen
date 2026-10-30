import './styles.css';
import { renderShell, type PageId } from './static-pages';
import { initTool } from './tool';
import { initTheme } from './theme';
import { GA4_ID } from './site-config';

const page = (document.body.dataset.page ?? 'home') as PageId;
const app = document.querySelector<HTMLElement>('#app');

if (app && !app.innerHTML.trim()) {
  app.innerHTML = renderShell(page);
}

initTheme();
initTool();

// Google Analytics 4 — only loads when an ID is configured AND the page runs on
// the production host, so local dev/preview traffic never pollutes the stats.
const isLocalHost = /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
  window.location.hostname
);
if (GA4_ID && import.meta.env.MODE !== 'test' && typeof document !== 'undefined' && !isLocalHost) {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA4_ID);
}
