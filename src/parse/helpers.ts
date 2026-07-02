import { TRANSACTION_TYPES } from '../types.js';
import type { Bank, TransactionType, Valuta } from '../types.js';
import type { BankConfig, CsvRow } from './csv.js';

const typeMap: Record<string, TransactionType> = {
    'Varekjøp': 'Varekjøp',
    'E-varekjøp': 'Varekjøp',
    'Varekjøp debetkort': 'Varekjøp',
    'Varekjøp ubetjent': 'Varekjøp',
    'Varekjøp i utlandet': 'Varekjøp',
    'Betaling innland': 'Betaling',
    'Betaling med melding innland': 'Betaling',
    'Betaling med KID innland': 'Giro',
    'Innlandsbetaling': 'Giro',
    'Giro': 'Giro',
    'Overføring': 'Overføring',
    'Straksbetaling': 'Overføring',
    'Overføring til egen konto': 'Kontoregulering',
    'Overføring fra egen konto': 'Kontoregulering',
    'Overføring til annen konto': 'Betaling',
    'Overføring fra annen konto': 'Overføring',
    'Nedbetaling av lån': 'Nedbetaling'
};

const knownTypes = new Set<string>(TRANSACTION_TYPES);

const normalizeType = (raw: string): TransactionType =>
    typeMap[raw] ?? (knownTypes.has(raw) ? (raw as TransactionType) : 'Annet');

export const cleanDescription = (desc: string): string =>
    desc
        .replace(
            /^(Visa\s+Varekjøp|E-varekjøp|Varekjøp i butikk|Varekjøp|Overføring Innland|Overføring Innlandet|Overføring|Visa|Giro|Kontoregulering|Renter|Lønn)\s+/i,
            ''
        )
        .replace(/^\d{2}\.\d{2}\s+/, '')
        .replace(/^\d+\s+/, '')
        .replace(/\b(Nok|Eur|Usd|Gbp|Dkk|Sek)\s+[\d,]+\s+/i, '')
        .replace(/\s*Valutakurs:\s*[\d,]+/, '')
        .trim();

export const getDate = (row: CsvRow, config: BankConfig): string => {
    const match = (row[config.fields.date] ?? '').match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) return '';

    const [, day = '', month = '', year = ''] = match;
    const iso = `${year}-${month}-${day}`;

    return Number.isNaN(new Date(iso).getTime()) ? '' : iso;
};

export const getDescription = (row: CsvRow, config: BankConfig): string =>
    cleanDescription(row[config.fields.description] ?? '');

/** Parse amounts like "150", "1234.56", "-1 234,56". */
const parseAmount = (value: string | undefined): number => {
    if (!value) return 0;

    const cleaned = value.replace(/\s/g, '');
    const normalized = cleaned.includes(',')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned;

    return parseFloat(normalized) || 0;
};

export const getAmount = (row: CsvRow, config: BankConfig, bank: Bank): number => {
    const outgoing = parseAmount(row[config.fields.outgoing]);
    const incoming = parseAmount(row[config.fields.incoming]);

    // DNB reports outgoing amounts as positive; Valle as already-signed
    return incoming + (bank === 'dnb' ? -outgoing : outgoing);
};

export const getRawType = (row: CsvRow, config: BankConfig): string => {
    if (config.fields.type) return row[config.fields.type] ?? '';
    return (row[config.fields.description] ?? '').split(/\s+/)[0] ?? '';
};

export const getType = (
    row: CsvRow,
    config: BankConfig,
    ownAccounts: string[]
): TransactionType => {
    const { toAccount } = config.fields;
    if (toAccount && ownAccounts.includes(row[toAccount] ?? '')) return 'Kontoregulering';

    return normalizeType(getRawType(row, config));
};

export const getCurrency = (row: CsvRow, config: BankConfig): Valuta => {
    const source = row[config.fields.currency ?? config.fields.description] ?? '';

    const currency = source.match(/\b(Nok|Eur|Usd|Gbp|Dkk|Sek)\b/i)?.[1]?.toUpperCase() ?? 'NOK';
    const exchangeRate = parseFloat(
        source.match(/(?:Valutakurs|Kurs):\s*([\d,.]+)/)?.[1]?.replace(',', '.') ?? '1'
    );

    return { currency, exchangeRate };
};
