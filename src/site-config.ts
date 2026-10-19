import config from '../site.config.json';

export const DEFAULT_SITE_URL: string = config.siteUrl;
export const BRAND: string = (config as { brand?: string }).brand ?? 'b64file';
export const FEEDBACK_EMAIL: string = (config as { feedbackEmail?: string }).feedbackEmail ?? '';
export const GA4_ID: string = (config as { ga4Id?: string }).ga4Id ?? '';
/** Chinese site URL, used for the zh/en hreflang pair (leave empty to omit hreflang) */
export const ZH_SITE_URL: string = (config as { zhSiteUrl?: string }).zhSiteUrl ?? '';
