/**
 * GA4 event helper. Safe no-op until the script loads
 * (i.e. until ga4Id is configured in site.config.json).
 * Only behavioral metadata is ever sent — never file names, content or input.
 */
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(category: string, action: string, label?: string): void {
  try {
    window.gtag?.('event', action, { event_category: category, event_label: label });
  } catch {
    // analytics must never interrupt the tool
  }
}
