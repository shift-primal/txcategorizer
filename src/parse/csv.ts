import Papa from 'papaparse';
import { getDate, getDescription, getAmt, getType, getCurrency } from '../util/parseHelpers.js';
import { Bank, RawTransaction } from '../types.js';

type FieldMap = Record<Bank, BankFields>;

export type CsvRow = Record<string, string>;

export type BankFields = {
    date: string;
    description: string;
    incoming: string;
    outgoing: string;
    type: string | undefined;
    currency: string | undefined;
    toAccount: string | undefined;
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
        toAccount: undefined,
    },
    valle: {
        date: 'Betalingstidspunkt',
        description: 'Skildring',
        incoming: 'Beløp inn',
        outgoing: 'Beløp ut',
        type: 'Undertype',
        currency: 'Melding/KID/Fakt.nr',
        toAccount: 'Til konto',
    },
};

const parse = (content: string): CsvRow[] =>
    Papa.parse<CsvRow>(content, { header: true, delimiter: ';', skipEmptyLines: true }).data;

export function parseSingleLine({ tx, bank }: { tx: string; bank: Bank }): RawTransaction {
    const fields = fieldMap[bank];
    const row = parse(headers[bank] + '\n' + tx)[0];

    return {
        date: getDate(row, fields),
        description: getDescription(row, fields),
        amount: getAmt(row, fields, bank),
        type: getType(row, fields, bank),
        valuta: getCurrency(row, fields, bank),
    };
}

export function parseCsvString(content: string, bank: Bank): RawTransaction[] {
    const fields = fieldMap[bank];

    const rows = parse(content).filter((row) =>
        /^\d{2}\.\d{2}\.\d{4}$/.test(row[fieldMap[bank].date]),
    );

    return rows.map((row) => ({
        date: getDate(row, fields),
        description: getDescription(row, fields),
        amount: getAmt(row, fields, bank),
        type: getType(row, fields, bank),
        valuta: getCurrency(row, fields, bank),
    }));
}
