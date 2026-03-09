import { BankFields, CsvRow } from '@/parse/csv.ts';
import { Bank } from '@/types.ts';
import { format, parse as parseDate } from 'date-fns';

export const getCurrency = (row: CsvRow, fields: BankFields, bank: Bank) => {
    const desc = bank === 'valle' ? row[fields.currency!] : row[fields.description];
    const currency = desc.match(/\b(Nok|Eur|Usd|Gbp|Dkk|Sek)\b/i)?.[1].toUpperCase() ?? 'NOK';
    const exchangeRate = parseFloat(
        desc.match(/(?:Valutakurs|Kurs):\s*([\d,.]+)/)?.[1].replace(',', '.') ?? '1',
    );

    console.log(currency, exchangeRate);

    return { currency, exchangeRate };
};

export const cleanDescription = (desc: string) =>
    desc
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

export const getDescription = (row: CsvRow, fields: BankFields, bank: Bank) => {
    if (bank === 'valle') return cleanDescription(row[fields.description]);

    const desc = row[fields.description].split(/\s+/);
    let sliceNum = 1;

    if (desc[1] === 'Innland' || desc[1] === 'Innlandet') sliceNum = 2;
    if (desc[1] === 'i') sliceNum = 3;

    return cleanDescription(desc.slice(sliceNum).join(' '));
};

export const getAmt = (row: CsvRow, fields: BankFields, bank: Bank) => {
    const out = parseFloat(row[fields.outgoing]) || 0;
    const inc = parseFloat(row[fields.incoming]) || 0;

    return inc + (bank === 'dnb' ? -out : out);
};

export const getType = (row: CsvRow, fields: BankFields, bank: Bank) => {
    if (bank === 'valle') return row[fields.type!] ?? '';

    return row[fields.description].split(/\s+/)[0];
};
