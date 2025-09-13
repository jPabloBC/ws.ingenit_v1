type CurrencyPrefs = { locale: string; currency: string; fractionDigits?: number };

const DEFAULT_PREFS: CurrencyPrefs = { locale: 'es-CL', currency: 'CLP', fractionDigits: 0 };

const CURRENCY_MAP: Record<string, CurrencyPrefs> = {
  CLP: { locale: 'es-CL', currency: 'CLP', fractionDigits: 0 },
  USD: { locale: 'en-US', currency: 'USD', fractionDigits: 2 },
  EUR: { locale: 'es-ES', currency: 'EUR', fractionDigits: 2 },
  ARS: { locale: 'es-AR', currency: 'ARS', fractionDigits: 0 },
  PEN: { locale: 'es-PE', currency: 'PEN', fractionDigits: 2 },
  MXN: { locale: 'es-MX', currency: 'MXN', fractionDigits: 2 },
  COP: { locale: 'es-CO', currency: 'COP', fractionDigits: 0 },
  BRL: { locale: 'pt-BR', currency: 'BRL', fractionDigits: 2 },
  BOB: { locale: 'es-BO', currency: 'BOB', fractionDigits: 2 },
};

export const setCurrencyPrefs = (prefs: Partial<CurrencyPrefs>) => {
  const current = getCurrencyPrefs();
  const merged = { ...current, ...prefs };
  try {
    localStorage.setItem('ws_currency_prefs', JSON.stringify(merged));
  } catch {}
};

export const getCurrencyPrefs = (): CurrencyPrefs => {
  try {
    const raw = localStorage.getItem('ws_currency_prefs');
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) } as CurrencyPrefs;
  } catch {}
  return DEFAULT_PREFS;
};

export const setCurrencyByCode = (currencyCode?: string) => {
  const prefs = (currencyCode && CURRENCY_MAP[currencyCode.toUpperCase()]) || DEFAULT_PREFS;
  setCurrencyPrefs(prefs);
};

  // Removido: función no usada









export const formatNumber = (number: number): string => {
  const { locale } = getCurrencyPrefs();
  return new Intl.NumberFormat(locale).format(number);
};

// Parse a user-typed currency/number string using current locale
export const parseCurrencyInput = (raw: string): number => {
  const { locale } = getCurrencyPrefs();
  try {
    const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
    const group = parts.find(p => p.type === 'group')?.value || '.';
    const decimal = parts.find(p => p.type === 'decimal')?.value || ',';
    let s = (raw || '').toString();
    // remove spaces and currency symbols/letters
    s = s.replace(/[\s\p{Sc}A-Za-z]/gu, '');
    // remove grouping separators
    s = s.split(group).join('');
    // keep only digits and decimal separator
    const allowed = new RegExp(`[^0-9\\${decimal}-]`, 'g');
    s = s.replace(allowed, '');
    if (decimal !== '.') s = s.replace(decimal, '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  } catch {
    const fallback = parseFloat((raw || '').toString().replace(/[^0-9.,-]/g, '').replace(',', '.'));
    return isNaN(fallback) ? 0 : fallback;
  }
};