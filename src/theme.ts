const STORAGE_KEY = 'b64file-theme';
const THEME_COLORS: Record<string, string> = { dark: '#1f1e1d', light: '#faf9f5' };

/**
 * Manual light/dark theme with persistence. The initial theme is resolved
 * by the inline head script (before first paint) using the stored choice or
 * the system preference; this module only wires the toggle button and keeps
 * the browser UI color (theme-color meta) in sync with the manual choice.
 */
export function initTheme(): void {
  const root = document.documentElement;
  if (!root.dataset.theme) {
    root.dataset.theme = prefersDark() ? 'dark' : 'light';
  }

  const btn = document.querySelector<HTMLButtonElement>('#theme-toggle');
  if (!btn) return;

  const updateIcon = () => {
    const dark = root.dataset.theme === 'dark';
    btn.textContent = dark ? '☀️' : '🌙';
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const color = THEME_COLORS[root.dataset.theme ?? 'light'];
    if (meta && color) meta.setAttribute('content', color);
  };

  btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable (private mode) — theme still applies for this session
    }
    updateIcon();
  });

  updateIcon();
}

function prefersDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
}
