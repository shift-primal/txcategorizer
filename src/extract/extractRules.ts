import { RawTransaction } from '../types\.js';
import { capFirstChar } from './extractHelpers.js';

const DEBUG = true;

const raw = (desc: string) => (DEBUG ? { raw: desc } : {});

const twoWordMerchants = [
    // Prefixes
    'Burger',
    'Mr',
    'New',
    'The',
    'King',
    'Cc',
    'Supermarket',
    'Crown',
    'Caffe',
    'Cafe',
    'Hotel',
    'Aashaug',
    'Gina',
    'Espresso',
    'Apotek',
    'Hage',
    'Circle',
    'Sostrene',
    'Søstrene',
    'Clas',
    'Liten',
    'Øya',
    'Euro',
    'Barnas',
    'Get',
    'Makeup',
    'Vero',
    'Coop',

    // Byer
    'Gjøvik',
    'Raufoss',
    'Lena',
    'Bøverbru',
    'Kapp',
    'Kolbu',
    'Reinsvoll',

    // Edgecases
    'Bentes',
    'EBILLETT',
    'Mc',
    'Sp',
    'Change',
];

const threeWordMerchants = ['Salt'];

export type MerchantRule = {
    match: (tx: RawTransaction) => boolean;
    extract: (tx: RawTransaction) => { merchant: string; counterparty?: string; raw?: string };
};

export const merchantRules: MerchantRule[] = [
    // --- Unique types ---

    // Omkostninger (Valle)
    {
        match: ({ type }) => type === 'Omkostninger',
        extract: ({ description }) => ({
            merchant: 'Omkostninger',
            ...raw(description),
        }),
    },

    // Overføring til egen konto (Valle)
    {
        match: ({ type }) => type === 'Kontoregulering',
        extract: ({ description }) => ({
            merchant: 'Kontoregulering',
            ...raw(description),
        }),
    },

    {
        // Til konto: 2890 71 04208" → loan repayment (Valle)
        match: ({ type }) => type === 'Nedbetaling',
        extract: ({ description }) => ({
            merchant: 'Nedbetaling av lån',
            ...raw(description),
        }),
    },

    {
        // "Haakon Østfelt (12066464367)" → Overføring + counterparty
        // "Tpp: jan-fredrik" → Vipps
        match: ({ type }) => type === 'Overføring',
        extract: ({ description }) => {
            if (description.includes('Tpp:')) {
                return {
                    merchant: 'Vipps',
                    counterparty: description.split(/\s+/).slice(0, 2).join(' '),
                    ...raw(description),
                };
            }
            return {
                merchant: 'Overføring',
                counterparty: description.replace(/\s*\(\d+\)/, '').trim(),
                ...raw(description),
            };
        },
    },

    {
        // "Lønn fra REMA 1000" → merchant: "REMA 1000"

        match: ({ type }) => type === 'Lønn',
        extract: ({ description }) => ({
            merchant: `Lønn: ${description.replace(/^(L\u00f8nn\s*)?(fra\s*)?/i, '').trim()}`,
            ...raw(description),
        }),
    },

    {
        // "Telenor Norge As, Mobil Efaktura" / "Nordea Finans (60060524559)" → strip account nr, split on Efaktura
        match: ({ type }) => type === 'Giro',
        extract: ({ description }) => {
            const cleaned = description.replace(/\s*\(\d{11,}\)/, '').trim();
            if (cleaned.includes('Efaktura')) {
                return {
                    merchant: cleaned
                        .split('Efaktura')[0]
                        .replace(/[,\s]+$/, '')
                        .trim(),
                    ...raw(description),
                };
            }
            return { merchant: cleaned, ...raw(description) };
        },
    },

    {
        // "Sofie Krukhaug Linde (12069003239)" → merchant: "Betaling", counterparty: "Sofie Krukhaug Linde"
        // "Verisure As (17105829310)" → merchant: "Verisure As"
        match: ({ type }) => type === 'Betaling',
        extract: ({ description }) => {
            const cleaned = description.replace(/\s*\(\d{11,}\)/, '').trim();
            const words = cleaned.split(/\s+/);
            const businessSuffixes = /\b(as|asa|sa|ab|ltd|gmbh)\b/i;
            const looksLikePerson = words.length >= 3 && !businessSuffixes.test(cleaned);
            if (looksLikePerson) {
                return { merchant: 'Betaling', counterparty: cleaned, ...raw(description) };
            }
            return { merchant: cleaned, ...raw(description) };
        },
    },

    // --- Visa subtypes (most specific first) ---

    {
        // "Vipps:vipps:jan-fredrik b" → merchant: "Vipps", counterparty: "Jan-fredrik B"
        match: ({ type, description }) => type === 'Visa' && description.includes('Vipps:'),
        extract: ({ description }) => {
            const name =
                description
                    .split('Vipps:')
                    .pop()
                    ?.replace(/^vipps:/i, '')
                    .trim() ?? '';
            return {
                merchant: 'Vipps',
                counterparty: capFirstChar(name),
                ...raw(description),
            };
        },
    },

    {
        // "Paypal :discord" → merchant: "Paypal", counterparty: "discord"
        match: ({ description }) =>
            (description.includes('Paypal') || description.includes('Klarna')) &&
            description.includes(':'),
        extract: ({ description }) => ({
            merchant: description.split(':')[0].trim(),
            counterparty: capFirstChar(description.split(':')[1]?.trim() ?? ''),
            ...raw(description),
        }),
    },

    {
        // "Supermarket Lucija", "Mr Vape Saloon", "New Yorker Croatia" → first 2 words
        match: ({ type, description }) =>
            type === 'Varekjøp' &&
            twoWordMerchants.some((w) => description.toLowerCase().startsWith(w.toLowerCase())),
        extract: ({ description }) => ({
            merchant: description.split(/\s+/).slice(0, 2).join(' '),
            ...raw(description),
        }),
    },

    {
        // "Salt And Battery London" → first 3 words
        match: ({ type, description }) =>
            type === 'Varekjøp' &&
            threeWordMerchants.some((w) => description.toLowerCase().startsWith(w.toLowerCase())),
        extract: ({ description }) => ({
            merchant: description.split(/\s+/).slice(0, 3).join(' '),
            ...raw(description),
        }),
    },

    {
        // "Revolut::1154:", "Telenor Norge" → merchant: first word, strip :suffix
        match: ({ type }) => type === 'Visa',
        extract: ({ description }) => ({
            merchant: description.split(/\s+/)[0].replace(/:.*$/, ''),
            ...raw(description),
        }),
    },

    // --- Varekjøp (card purchases) ---

    {
        // "Klarna*VERO MODA" → "VERO MODA"
        match: ({ description }) => description.includes('Klarna*'),
        extract: ({ description }) => ({
            merchant: description.split('Klarna*')[1].trim(),
            ...raw(description),
        }),
    },

    {
        // "Vipps*Uno-X" → merchant: "Uno-X"
        match: ({ type, description }) => type === 'Varekjøp' && description.startsWith('Vipps*'),
        extract: ({ description }) => ({
            merchant: description.split('Vipps*')[1].trim(),
            ...raw(description),
        }),
    },

    {
        // "Extra Tveita Se Tvetenveien Oslo Dato..." → merchant: "Extra"
        // "KIWI 012 RAUFOS STORGATA 68 RAUFOSS" → merchant: "KIWI"
        match: ({ type }) => type === 'Varekjøp',
        extract: ({ description }) => ({
            merchant: description.split(/\s+/)[0],
            ...raw(description),
        }),
    },
];
