import {
    defaultCityPrefixes,
    defaultCorporateSuffixPattern,
    defaultNWordMerchants,
} from '../defaultOptions.js';
import { RawTransaction } from '../types.js';
import { capFirstChar } from './extractHelpers.js';

export type MerchantRule = {
    match: (tx: RawTransaction) => boolean;
    extract: (tx: RawTransaction) => { merchant: string; counterparty?: string; raw?: string };
};

// Strip account number suffixes like "(12345678901)"
const stripAccountNo = (s: string) => s.replace(/\s*\(\d{11,}\)/, '').trim();

// True if name looks like a person rather than a company
const isPerson = (name: string, corporateSuffixPattern: RegExp) =>
    name.split(/\s+/).length >= 3 && !corporateSuffixPattern.test(name);

// For DNB Overføring: trim free-text after "Betaling" or "Tpp:", else take first 2 words
const trimCounterparty = (desc: string) => {
    const beforeKeyword = desc.split(/\s+(?=Betaling\b|Tpp:)/i)[0]?.trim() ?? desc;
    const words = beforeKeyword.split(/\s+/);
    return words.length > 2 && !/\(\d+\)/.test(desc)
        ? words.slice(0, 2).join(' ')
        : beforeKeyword.replace(/\s*\(\d+\)/, '').trim();
};

export function createMerchantRules(
    cityPrefixes: string[] = defaultCityPrefixes,
    nWordMerchants: Record<string, number> = defaultNWordMerchants,
    corporateSuffixPattern: RegExp = defaultCorporateSuffixPattern,
    debug = false,
): MerchantRule[] {
    const raw = (desc: string) => (debug ? { raw: desc } : {});

    return [
        // ── Fixed-type rules (Valle-specific types) ──────────────────────────

        {
            match: ({ type }) => type === 'Omkostninger',
            extract: ({ description }) => ({ merchant: 'Omkostninger', ...raw(description) }),
        },

        {
            match: ({ type }) => type === 'Kontoregulering',
            extract: ({ description }) => ({ merchant: 'Kontoregulering', ...raw(description) }),
        },

        {
            match: ({ type }) => type === 'Nedbetaling',
            extract: ({ description }) => ({ merchant: 'Nedbetaling av lån', ...raw(description) }),
        },

        // ── Overføring ────────────────────────────────────────────────────────
        // Tpp: or Straksbetaling → Vipps (unless "Til konto:" → plain transfer)
        // Otherwise → Overføring with counterparty
        {
            match: ({ type }) => type === 'Overføring',
            extract: ({ description, rawType }) => {
                const isVipps = description.startsWith('Tpp:') || rawType === 'Straksbetaling';
                if (isVipps) {
                    if (description.startsWith('Til konto:'))
                        return { merchant: 'Overføring', ...raw(description) };
                    const counterparty = description.startsWith('Tpp:')
                        ? description.split('Tpp:')[1]?.trim() ?? description
                        : trimCounterparty(description);
                    return { merchant: 'Vipps', counterparty, ...raw(description) };
                }
                return {
                    merchant: 'Overføring',
                    counterparty: trimCounterparty(description),
                    ...raw(description),
                };
            },
        },

        // ── Lønn ──────────────────────────────────────────────────────────────
        // "Lønn fra REMA 1000" → "Lønn: REMA 1000"
        {
            match: ({ type }) => type === 'Lønn',
            extract: ({ description }) => {
                const employer = description.replace(/^(Lønn\s*)?(fra\s*)?/i, '').trim();
                return {
                    merchant: employer ? `Lønn: ${employer}` : 'Lønn',
                    ...raw(description),
                };
            },
        },

        // ── Giro ──────────────────────────────────────────────────────────────
        // Efaktura → extract company before "Efaktura"
        // Person name (≥3 words, no corp suffix) → Overføring + counterparty
        // Otherwise → strip corp suffix, use as merchant
        {
            match: ({ type }) => type === 'Giro',
            extract: ({ description }) => {
                const cleaned = stripAccountNo(description);
                if (cleaned.includes('Efaktura')) {
                    return {
                        merchant: cleaned
                            .split('Efaktura')[0]
                            .replace(/[,\s]+$/, '')
                            .trim(),
                        ...raw(description),
                    };
                }
                const stripped = cleaned.replace(corporateSuffixPattern, '').trim();
                if (isPerson(stripped, corporateSuffixPattern)) {
                    return { merchant: 'Overføring', counterparty: stripped, ...raw(description) };
                }
                return { merchant: stripped, ...raw(description) };
            },
        },

        // ── Betaling ──────────────────────────────────────────────────────────
        // Person name (≥3 words, no corp suffix) → Betaling + counterparty
        // Otherwise → use cleaned name as merchant
        {
            match: ({ type }) => type === 'Betaling',
            extract: ({ description }) => {
                const cleaned = stripAccountNo(description);
                if (isPerson(cleaned, corporateSuffixPattern)) {
                    return { merchant: 'Betaling', counterparty: cleaned, ...raw(description) };
                }
                return { merchant: cleaned, ...raw(description) };
            },
        },

        // ── Visa: specific patterns (most specific first) ─────────────────────

        // "Vipps:vipps:jan-fredrik b" → Vipps + counterparty
        {
            match: ({ type, description }) => type === 'Visa' && description.includes('Vipps:'),
            extract: ({ description }) => {
                const name =
                    description
                        .split('Vipps:')
                        .pop()
                        ?.replace(/^vipps:/i, '')
                        .trim() ?? '';
                return { merchant: 'Vipps', counterparty: capFirstChar(name), ...raw(description) };
            },
        },

        // "Paypal :discord" / "Klarna :merchant" → merchant + counterparty
        {
            match: ({ description }) =>
                (description.includes('Paypal') || description.includes('Klarna')) &&
                description.includes(':'),
            extract: ({ description }) => ({
                merchant: description.split(':')[0].trim(),
                counterparty: capFirstChar(description.split(':')[1]?.trim() ?? ''),
                ...raw(description),
            }),
        },

        // "Zettle_*astral" / "Zettle_:waffle" → merchant after * or :
        {
            match: ({ description }) => /zettle/i.test(description) && /[*:]/.test(description),
            extract: ({ description }) => ({
                merchant: capFirstChar(description.split(/[*:]/)[1]?.trim() ?? 'Zettle'),
                ...raw(description),
            }),
        },

        // ── Visa / Varekjøp: known multi-word merchants ───────────────────────
        // "Supermarket Lucija" → 2 words, "Salt og Pepper" → 3 words
        {
            match: ({ type, description }) =>
                (type === 'Varekjøp' || type === 'Visa') &&
                Object.keys(nWordMerchants).some((w) =>
                    description.toLowerCase().startsWith(w.toLowerCase()),
                ),
            extract: ({ description }) => {
                const entry = Object.entries(nWordMerchants).find(([w]) =>
                    description.toLowerCase().startsWith(w.toLowerCase()),
                );
                const n = entry?.[1] ?? 1;
                return {
                    merchant: description.split(/\s+/).slice(0, n).join(' '),
                    ...raw(description),
                };
            },
        },

        // ── Visa / Varekjøp: city-prefixed merchants ──────────────────────────
        // Varekjøp: "Gjøvik Specsave" → "Specsave" (strip city)
        // Visa:     "Gjøvik Poliklinikk" → "Gjøvik Poliklinikk" (keep city)
        {
            match: ({ type, description }) => {
                const firstWord = description.split(/\s+/)[0].toLowerCase();
                return (
                    (type === 'Varekjøp' || type === 'Visa') &&
                    cityPrefixes.some((c) => firstWord === c.toLowerCase())
                );
            },
            extract: ({ type, description }) => {
                const words = description.split(/\s+/);
                const merchant =
                    type === 'Visa' ? words.slice(0, 2).join(' ') : words.slice(1, 2).join(' ');
                return { merchant, ...raw(description) };
            },
        },

        // ── Visa: fallback ────────────────────────────────────────────────────
        // "Revolut::1154:" → "Revolut", "Telenor Norge" → "Telenor"
        {
            match: ({ type }) => type === 'Visa',
            extract: ({ description }) => ({
                merchant: description.split(/\s+/)[0].replace(/:.*$/, ''),
                ...raw(description),
            }),
        },

        // ── Varekjøp: specific patterns ───────────────────────────────────────

        // "20/11_55528_circle_k" → "Circle K"
        {
            match: ({ description }) => /^\d+\/\d+_\d+_/.test(description),
            extract: ({ description }) => ({
                merchant: capFirstChar(
                    description
                        .replace(/^\d+\/\d+_\d+_/, '')
                        .split('_')
                        .slice(0, 2)
                        .join(' ')
                        .trim(),
                ),
                ...raw(description),
            }),
        },

        // "Klarna*VERO MODA" / "Vipps*Uno-X" → extract after *, fallback to prefix
        {
            match: ({ description }) => description.includes('*'),
            extract: ({ description }) => ({
                merchant: description.split('*')[1]?.trim() || description.split('*')[0].trim(),
                ...raw(description),
            }),
        },

        // ── Varekjøp: fallback ────────────────────────────────────────────────
        // "KIWI 012 RAUFOSS STORGATA..." → "KIWI"
        {
            match: ({ type }) => type === 'Varekjøp',
            extract: ({ description }) => ({
                merchant: description.split(/\s+/)[0],
                ...raw(description),
            }),
        },
    ];
}

export const merchantRules = createMerchantRules();
