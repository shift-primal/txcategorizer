import Papa from 'papaparse';
import { getAmount, getCurrency, getDate, getDescription, getRawType, getType } from './helpers.js';
import type { Bank, RawTransaction, ResolvedOptions } from '../types.js';

export type CsvRow = Record<string, string | undefined>;

export type BankConfig = {
    encoding: 'utf-8' | 'windows-1252';
    fields: {
        date: string;
        description: string;
        incoming: string;
        outgoing: string;
        /** Column holding the transaction type. Banks without one derive it from the description. */
        type?: string;
        /** Column holding currency info. Defaults to the description column. */
        currency?: string;
        /** Column holding the receiving account number, used for own-account detection. */
        toAccount?: string;
    };
};

export const bankConfigs: Record<Bank, BankConfig> = {
    dnb: {
        encoding: 'utf-8',
        fields: {
            date: 'Dato',
            description: 'Forklaring',
            incoming: 'Inn på konto',
            outgoing: 'Ut fra konto'
        }
    },
    valle: {
        encoding: 'windows-1252',
        fields: {
            date: 'Betalingstidspunkt',
            description: 'Skildring',
            incoming: 'Beløp inn',
            outgoing: 'Beløp ut',
            type: 'Undertype',
            currency: 'Melding/KID/Fakt.nr',
            toAccount: 'Til konto'
        }
    }
};

const DATE_PATTERN = /^\d{2}\.\d{2}\.\d{4}$/;

const parseRows = (content: string): CsvRow[] =>
    Papa.parse<CsvRow>(content, { header: true, delimiter: ';', skipEmptyLines: true }).data;

export function parseCsv(content: string, bank: Bank, options: ResolvedOptions): RawTransaction[] {
    const config = bankConfigs[bank];

    const rows = parseRows(content).filter((row) =>
        DATE_PATTERN.test(row[config.fields.date] ?? '')
    );

    const transactions: RawTransaction[] = [];

    for (const row of rows) {
        const date = getDate(row, config);
        const amount = getAmount(row, config, bank);
        const description = getDescription(row, config);

        if (!date || Number.isNaN(amount) || !description) {
            if (options.debug) console.warn('[txcategorizer] skipping invalid row:', row);
            continue;
        }

        transactions.push({
            date,
            description,
            amount,
            type: getType(row, config, options.ownAccounts),
            rawType: getRawType(row, config),
            valuta: getCurrency(row, config)
        });
    }

    return transactions;
}
