import { RawTransaction } from '../parse/csv.ts';
import { capFirstChar } from '../util/extractHelpers.ts';

const DEBUG = true;

const raw = (desc: string) => (DEBUG ? { raw: desc } : {});

export const merchantDict: Record<string, string> = {
    'extra': 'Coop Extra',
    'mdc': "McDonald's",
    'mcdonalds': "McDonald's",
    'lyko.com/no': 'Lyko',
    'apple.com/bill': 'Apple',
    'bk': 'Burger King',
    'ossg': 'Gjøvik Poliklinikk',
    'no0770': 'H&M',
    'berit': 'Kjolesenteret Lillo',
    'rema': 'REMA 1000',
    'uno-x': 'Uno-X',
    'steamgames.com': 'Steam',
};

const twoWordMerchants = [
    'Mr',
    'New',
    'Supermarket',
    'Crown',
    'Cc',
    'King',
    'Burger',
    'Caffe',
    'Cafe',
    'Change',
    'Hotel',
    'Aashaug',
    'The',
    'Clas',
    'Sostrene',
    'Søstrene',
    'Liten',
    'Sp',
];

const varekjopTypes = [
    'Varekjøp',
    'E-varekjøp',
    'Varekjøp debetkort',
    'Varekjøp ubetjent',
    'Varekjøp i utlandet',
];

const betalingTypes = [
    'Betaling med KID innland',
    'Betaling innland',
    'Betaling med melding innland',
];

type MerchantRule = {
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
        match: ({ type }) => type === 'Overføring til egen konto',
        extract: ({ description }) => ({
            merchant: 'Overføring til egen konto',
            ...raw(description),
        }),
    },

    {
        // Til konto: 2890 71 04208" → loan repayment (Valle)
        match: ({ type }) => type === 'Nedbetaling av lån',
        extract: ({ description }) => ({
            merchant: 'Nedbetaling av lån',
            ...raw(description),
        }),
    },

    {
        // "Haakon Østfelt (12066464367)" → Overføring + counterparty (Valle)
        match: ({ type }) => type === 'Straksbetaling',
        extract: ({ description }) => ({
            merchant: 'Overføring',
            counterparty: description.replace(/\s*\(\d+\)/, '').trim(),
            ...raw(description),
        }),
    },
    {
        // "Gjensidige Forsikring Asa (60050608460)" → merchant without account number (Valle)
        match: ({ type }) => betalingTypes.some((t) => t === type),
        extract: ({ description }) => ({
            merchant: description.replace(/\s*\(\d+\)/, '').trim(),
            ...raw(description),
        }),
    },

    {
        // "Lønn fra REMA 1000" → merchant: "REMA 1000"
        match: ({ type }) => type === 'Lønn',
        extract: ({ description }) => ({
            merchant: `Lønn: ${description.replace('Lønn fra ', '')}`,
            ...raw(description),
        }),
    },
    {
        // "VERISURE AS (17105829310)" → merchant: "VERISURE AS"
        match: ({ type }) => betalingTypes.some((t) => t === type),
        extract: ({ description }) => ({
            merchant: description.replace(/\s*\(\d+\)/, '').trim(),
            ...raw(description),
        }),
    },
    {
        // "800 Blommer" → merchant: "Kontoregulering", counterparty: "Blommer"
        match: ({ type }) => type === 'Kontoregulering',
        extract: ({ description }) => ({
            merchant: 'Kontoregulering',
            counterparty: description.split(/\s+/).slice(0, 2).join(' '),
            ...raw(description),
        }),
    },
    {
        // "Telenor Norge As, Mobil Efaktura" → merchant: "Telenor"
        match: ({ type }) => type === 'Giro',
        extract: ({ description }) => {
            if (description.includes('Efaktura')) {
                return {
                    merchant: description.split('Efaktura')[0].trim(),
                    ...raw(description),
                };
            }
            return {
                merchant: description.split(/\s+/).slice(0, 2).join(' '),
                ...raw(description),
            };
        },
    },
    {
        // "Eline Julianne Linde Bommer Pizza" → merchant: "Overføring", counterparty: "Eline Julianne"
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
                counterparty: description.split(/\s+/).slice(0, 2).join(' '),
                ...raw(description),
            };
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
        match: ({ type, description }) =>
            ((description.includes('Paypal') || description.includes('Klarna')) &&
                description.includes(':')) ||
            type === 'Visa',
        extract: ({ description }) => ({
            merchant: description.split(':')[0].trim(),
            counterparty: capFirstChar(description.split(':')[1]?.trim() ?? ''),
            ...raw(description),
        }),
    },

    {
        // "Supermarket Lucija", "Mr Vape Saloon", "New Yorker Croatia" → first 2 words
        match: ({ type, description }) =>
            (varekjopTypes.some((t) => type === t) || type === 'Visa') &&
            twoWordMerchants.some((w) => description.toLowerCase().startsWith(w.toLowerCase())),
        extract: ({ description }) => ({
            merchant: description.split(/\s+/).slice(0, 2).join(' '),
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
        match: ({ type, description }) =>
            varekjopTypes.some((t) => type === t) && description.startsWith('Vipps*'),
        extract: ({ description }) => ({
            merchant: description.split('Vipps*')[1].trim(),
            ...raw(description),
        }),
    },

    {
        // "Extra Tveita Se Tvetenveien Oslo Dato..." → merchant: "Extra"
        // "KIWI 012 RAUFOS STORGATA 68 RAUFOSS" → merchant: "KIWI"
        match: ({ type }) => varekjopTypes.some((t) => type === t),
        extract: ({ description }) => ({
            merchant: description.split(/\s+/)[0],
            ...raw(description),
        }),
    },
];
