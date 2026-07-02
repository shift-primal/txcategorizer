import { describe, it, expect } from 'vitest';
import { parseCsv } from '../src/parse/csv.js';
import { resolveOptions } from '../src/defaults.js';

const DNB_HEADER = '"Dato";"Forklaring";"Rentedato";"Ut fra konto";"Inn på konto"';

const dnbRow = (forklaring: string, ut = '0', inn = '0', dato = '01.01.2025') =>
    `"${dato}";"${forklaring}";"02.01.2025";"${ut}";"${inn}"`;

const dnbCsv = (...rows: string[]) => [DNB_HEADER, ...rows].join('\n');

const parseDnbRow = (row: string) => parseCsv(dnbCsv(row), 'dnb', resolveOptions())[0]!;

const VALLE_HEADER =
    'Betalingstidspunkt;Bokført dato;Valuteringsdato;Skildring;Type;Undertype;Frå konto;Avsendar;Til konto;Mottakarnamn;Beløp inn;Beløp ut;Valuta;Status;Melding/KID/Fakt.nr;eFaktura;eFaktura eier;eFaktura type;Melding;KID;Faktura nr.';

const valleRow = (values: Record<string, string>) =>
    VALLE_HEADER.split(';')
        .map((column) => values[column] ?? '')
        .join(';');

const valleCsv = (...rows: string[]) => [VALLE_HEADER, ...rows].join('\n');

describe('parseCsv (DNB)', () => {
    it('parses a basic expense', () => {
        const tx = parseDnbRow(dnbRow('Varekjøp 01.01 12345 KIWI 012 RAUFOSS', '150', '0'));
        expect(tx.amount).toBe(-150);
        expect(tx.type).toBe('Varekjøp');
        expect(tx.description).toBe('KIWI 012 RAUFOSS');
    });

    it('parses a basic income', () => {
        const tx = parseDnbRow(dnbRow('Lønn fra Rema 1000', '0', '30000'));
        expect(tx.amount).toBe(30000);
        expect(tx.type).toBe('Lønn');
    });

    it('parses a Visa transaction', () => {
        const tx = parseDnbRow(dnbRow('Visa 100121 Telenor Norge', '599', '0'));
        expect(tx.type).toBe('Visa');
        expect(tx.description).toBe('Telenor Norge');
    });

    it('strips Visa Varekjøp combined prefix', () => {
        const tx = parseDnbRow(
            dnbRow('Visa Varekjøp Steam Purchase Reservert transaksjon', '600', '0')
        );
        expect(tx.description).toBe('Steam Purchase Reservert transaksjon');
        expect(tx.type).toBe('Visa');
    });

    it('parses date correctly', () => {
        const tx = parseDnbRow(dnbRow('Varekjøp 05.02 55528 REMA 1000', '200', '0', '05.02.2026'));
        expect(tx.date).toBe('2026-02-05');
    });

    it('parses comma-decimal amounts', () => {
        const tx = parseDnbRow(dnbRow('Varekjøp 01.01 12345 KIWI', '1 234,56', '0'));
        expect(tx.amount).toBe(-1234.56);
    });

    it('parses multiple rows', () => {
        const csv = dnbCsv(
            dnbRow('Varekjøp 01.01 12345 KIWI 012 RAUFOSS', '150', '0', '01.01.2025'),
            dnbRow('Lønn fra Rema 1000', '0', '30000', '25.01.2025')
        );
        const result = parseCsv(csv, 'dnb', resolveOptions());
        expect(result).toHaveLength(2);
        expect(result[0]!.type).toBe('Varekjøp');
        expect(result[1]!.type).toBe('Lønn');
    });

    it('filters rows with invalid dates', () => {
        const csv = dnbCsv(
            dnbRow('Varekjøp 01.01 12345 KIWI', '150', '0', '01.01.2025'),
            '"not-a-date";"Varekjøp KIWI";"02.01.2025";"100";"0"'
        );
        const result = parseCsv(csv, 'dnb', resolveOptions());
        expect(result).toHaveLength(1);
    });

    it('keeps Overføring type for transfers', () => {
        const csv = dnbCsv(dnbRow('Overføring til konto 1234 56 78901', '5000', '0'));
        const result = parseCsv(csv, 'dnb', resolveOptions());
        expect(result[0]!.type).toBe('Overføring');
    });
});

describe('parseCsv (Valle)', () => {
    it('parses a basic expense with signed amount', () => {
        const csv = valleCsv(
            valleRow({
                'Betalingstidspunkt': '01.01.2025',
                'Skildring': 'KIWI 012 RAUFOSS',
                'Undertype': 'Varekjøp debetkort',
                'Beløp ut': '-150'
            })
        );
        const [tx] = parseCsv(csv, 'valle', resolveOptions());
        expect(tx!.amount).toBe(-150);
        expect(tx!.type).toBe('Varekjøp');
        expect(tx!.date).toBe('2025-01-01');
    });

    it('marks transfers to own accounts as Kontoregulering', () => {
        const csv = valleCsv(
            valleRow({
                'Betalingstidspunkt': '01.01.2025',
                'Skildring': 'Overføring til sparekonto',
                'Undertype': 'Overføring til annen konto',
                'Til konto': '1234 56 78901',
                'Beløp ut': '-5000'
            })
        );
        const [tx] = parseCsv(csv, 'valle', resolveOptions({ ownAccounts: ['1234 56 78901'] }));
        expect(tx!.type).toBe('Kontoregulering');
    });

    it('normalizes unknown types to Annet', () => {
        const csv = valleCsv(
            valleRow({
                'Betalingstidspunkt': '01.01.2025',
                'Skildring': 'Mystisk transaksjon',
                'Undertype': 'Helt ukjent type',
                'Beløp ut': '-10'
            })
        );
        const [tx] = parseCsv(csv, 'valle', resolveOptions());
        expect(tx!.type).toBe('Annet');
    });

    it('extracts currency and exchange rate from the KID column', () => {
        const csv = valleCsv(
            valleRow({
                'Betalingstidspunkt': '01.01.2025',
                'Skildring': 'STEAM PURCHASE',
                'Undertype': 'Varekjøp i utlandet',
                'Beløp ut': '-120',
                'Melding/KID/Fakt.nr': 'Eur 10,00 Valutakurs: 11,50'
            })
        );
        const [tx] = parseCsv(csv, 'valle', resolveOptions());
        expect(tx!.valuta).toEqual({ currency: 'EUR', exchangeRate: 11.5 });
    });
});
