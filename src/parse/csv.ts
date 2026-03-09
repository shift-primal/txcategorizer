import { parse as parseCsv } from '@std/csv';
import { getDate, getDescription, getAmt, getType, getCurrency } from '@/util/parseHelpers.ts';
import { readFile } from '@/io/readfile.ts';
import { Bank, RawTransaction } from '@/types.ts';

type FieldMap = Record<Bank, BankFields>;

export type CsvRow = Record<string, string>;

export type BankFields = {
    date: string;
    description: string;
    incoming: string;
    outgoing: string;
    type: string | undefined;
    currency: string | undefined;
};

const headers = {
    dnb: '"Dato";"Forklaring";"Rentedato";"Ut fra konto";"Inn på konto"',
    valle: 'Betalingstidspunkt;Bokført dato;Valuteringsdato;Skildring;Type;Undertype;Frå konto;Avsendar;Til konto;Mottakarnamn;Beløp inn;Beløp ut;Valuta;Status;Melding/KID/Fakt.nr;eFaktura;eFaktura eier;eFaktura type;Melding;KID;Faktura nr.',
};

const fieldMap: FieldMap = {
    dnb: {
        date: 'Dato',
        description: 'Forklaring',
        incoming: 'Inn på konto',
        outgoing: 'Ut fra konto',
        type: undefined,
        currency: undefined,
    },
    valle: {
        date: 'Betalingstidspunkt',
        description: 'Skildring',
        incoming: 'Beløp inn',
        outgoing: 'Beløp ut',
        type: 'Undertype',
        currency: 'Melding/KID/Fakt.nr',
    },
};

export function parseSingleLine({ tx, bank }: { tx: string; bank: Bank }): RawTransaction {
    const fields = fieldMap[bank];
    const row = parseCsv(headers[bank] + '\n' + tx, {
        skipFirstRow: true,
        separator: ';',
    })[0];

    return {
        date: getDate(row, fields),
        description: getDescription(row, fields, bank),
        amount: getAmt(row, fields, bank),
        type: getType(row, fields, bank),
        ...getCurrency(row, fields, bank),
    };
}

export function parseCsvString(content: string, bank: Bank): RawTransaction[] {
    const fields = fieldMap[bank];

    // Filter: for skipping last two rows (summary) (only valle)
    const rows = parseCsv(content, { skipFirstRow: true, separator: ';' }).filter((row) =>
        /^\d{2}\.\d{2}\.\d{4}$/.test(row[fieldMap[bank].date]),
    );

    return rows.map((row) => ({
        date: getDate(row, fields),
        description: getDescription(row, fields, bank),
        amount: getAmt(row, fields, bank),
        type: getType(row, fields, bank),
        ...getCurrency(row, fields, bank),
    }));
}

export async function parseFullFile(filePath: string, bank: Bank): Promise<RawTransaction[]> {
    const content = await readFile(filePath, bank);
    return parseCsvString(content, bank);
}
