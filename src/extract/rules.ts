import { RawTransaction } from '../parse/csv.ts';

type MerchantRule = {
    match: (tx: RawTransaction) => boolean;
    extract: (tx: RawTransaction) => { merchant: string; counterparty?: string };
};

export const merchantRules: MerchantRule[] = [
    {
        // "Lønn fra REMA 1000" → "REMA 1000"
        match: ({ type }) => type === 'Lønn',
        extract: ({ description }) => ({ merchant: description.replace('Lønn fra ', '') }),
    },
    {
        // "VERISURE AS (17105829310)" → "VERISURE AS"
        match: ({ type }) => type === 'Betaling innland',
        extract: ({ description }) => ({ merchant: description.replace(/\s*\(\d+\)/, '').trim() }),
    },
    {
        // "100021 Vipps:klarna" → "klarna"
        match: ({ type, description }) => type === 'Visa' && description.includes('Vipps:'),
        extract: ({ description }) => ({ merchant: description.split('Vipps:')[1].trim() }),
    },
    {
        // "Vipps*Uno-X" → "Uno-X"
        match: ({ description }) => description.startsWith('Vipps*'),
        extract: ({ description }) => ({ merchant: description.split('Vipps*')[1].trim() }),
    },

    {
        // "Extra Tveita Se Tvetenveien Oslo Dato..." → "Extra"
        match: ({ type }) => type === 'Varekjøp' || type === 'E-varekjøp',
        extract: ({ description }) => ({ merchant: description.split(/\s+/)[0] }),
    },
    {
        match: ({ type }) => type === 'Overføring',
        extract: ({ description }) => {
            if (description.includes('Tpp:')) {
                return {
                    merchant: 'Vipps',
                    counterparty: description.split(/\s+/).slice(0, 2).join(' '),
                };
            }
            return {
                merchant: 'Overføring',
                counterparty: description.split(/\s+/).slice(0, 2).join(' '),
            };
        },
    },
    {
        match: ({ type }) => type === 'Giro',
        extract: ({ description }) => {
            if (description.includes('Efaktura')) {
                return { merchant: description.split('Efaktura')[0].trim() };
            }
            return { merchant: description.split(/\s+/).slice(0, 2).join(' ') };
        },
    },
    {
        match: ({ type }) => type === 'Visa',
        extract: ({ description }) => ({
            merchant: description.split(/\s+/)[0].replace(/::\d+:.*/, ''),
        }),
    },
    {
        match: ({ type }) => type === 'Kontoregulering',
        extract: ({ description }) => ({
            merchant: 'Kontoregulering',
            counterparty: description.split(/\s+/).slice(0, 2).join(' '),
        }),
    },
];
