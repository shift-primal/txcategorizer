import { BankFields, CsvRow } from '../parse/csv.js';
import { Bank, TransactionType } from '../types.js';
import { format, parse as parseDate } from 'date-fns';
import { ownAccounts } from '../config.js';

const typeMap: Record<string, TransactionType> = {
    'Varekjøp': 'Varekjøp',
    'E-varekjøp': 'Varekjøp',
    'Varekjøp debetkort': 'Varekjøp',
    'Varekjøp ubetjent': 'Varekjøp',
    'Varekjøp i utlandet': 'Varekjøp',
    'Betaling innland': 'Betaling',
    'Betaling med melding innland': 'Betaling',
    'Betaling med KID innland': 'Giro',
    'Giro': 'Giro',
    'Overføring': 'Overføring',
    'Straksbetaling': 'Overføring',
    'Overføring til egen konto': 'Kontoregulering',
    'Overføring fra egen konto': 'Kontoregulering',
    'Overføring til annen konto': 'Betaling',
    'Overføring fra annen konto': 'Overføring',
    'Nedbetaling av lån': 'Nedbetaling',
};

const normalizeType = (raw: string): TransactionType => typeMap[raw] ?? (raw as TransactionType);

export const getCurrency = (row: CsvRow, fields: BankFields, bank: Bank) => {
    const desc = bank === 'valle' ? row[fields.currency!] : row[fields.description];
    const currency = desc.match(/\b(Nok|Eur|Usd|Gbp|Dkk|Sek)\b/i)?.[1].toUpperCase() ?? 'NOK';
    const exchangeRate = parseFloat(
        desc.match(/(?:Valutakurs|Kurs):\s*([\d,.]+)/)?.[1].replace(',', '.') ?? '1',
    );

    return { currency, exchangeRate };
};

export const cleanDescription = (desc: string) =>
    desc
        .replace(
            /^(E-varekj\u00f8p|Varekj\u00f8p i butikk|Varekj\u00f8p|Overf\u00f8ring Innland|Overf\u00f8ring Innlandet|Overf\u00f8ring|Visa|Giro|Kontoregulering|Renter|L\u00f8nn)\s+/i,
            '',
        )
        .replace(/^\d{2}\.\d{2}\s+/, '')
        .replace(/^\d+\s+/, '')
        .replace(/\b(Nok|Eur|Usd|Gbp|Dkk|Sek)\s+[\d,]+\s+/i, '')
        .replace(/\s*Valutakurs:\s*[\d,]+/, '')
        .trim();

export const getDate = (row: CsvRow, fields: BankFields) => {
    const dateStr = row[fields.date];

    if (!dateStr) return '';

    const parsed = parseDate(dateStr, 'dd.MM.yyyy', new Date());

    if (isNaN(parsed.getTime())) return '';

    return format(parsed, 'yyyy-MM-dd');
};

export const getDescription = (row: CsvRow, fields: BankFields) =>
    cleanDescription(row[fields.description]);

export const getAmt = (row: CsvRow, fields: BankFields, bank: Bank) => {
    const out = parseFloat(row[fields.outgoing]) || 0;
    const inc = parseFloat(row[fields.incoming]) || 0;

    return inc + (bank === 'dnb' ? -out : out);
};

export const getType = (row: CsvRow, fields: BankFields, bank: Bank): TransactionType => {
    if (fields.toAccount && ownAccounts.includes(row[fields.toAccount])) return 'Kontoregulering';

    if (bank === 'valle') return normalizeType(row[fields.type!]);

    return normalizeType(row[fields.description].split(/\s+/)[0]);
};
