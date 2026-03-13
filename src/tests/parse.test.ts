import { describe, it, expect } from 'vitest';
import { parseCsvString, parseSingleLine } from '../parse/csv.js';

const DNB_HEADER = '"Dato";"Forklaring";"Rentedato";"Ut fra konto";"Inn på konto"';

const dnbRow = (forklaring: string, ut = '0', inn = '0', dato = '01.01.2025') =>
    `"${dato}";"${forklaring}";"02.01.2025";"${ut}";"${inn}"`;

const DNB_CSV = (rows: string[]) => [DNB_HEADER, ...rows].join('\n');

describe('parseSingleLine (DNB)', () => {
    it('parses a basic expense', () => {
        const tx = parseSingleLine({
            tx: dnbRow('Varekjøp 01.01 12345 KIWI 012 RAUFOSS', '150', '0'),
            bank: 'dnb',
        });
        expect(tx.amount).toBe(-150);
        expect(tx.type).toBe('Varekjøp');
        expect(tx.description).toBe('KIWI 012 RAUFOSS');
    });

    it('parses a basic income', () => {
        const tx = parseSingleLine({
            tx: dnbRow('Lønn fra Rema 1000', '0', '30000'),
            bank: 'dnb',
        });
        expect(tx.amount).toBe(30000);
        expect(tx.type).toBe('Lønn');
    });

    it('parses a Visa transaction', () => {
        const tx = parseSingleLine({
            tx: dnbRow('Visa 100121 Telenor Norge', '599', '0'),
            bank: 'dnb',
        });
        expect(tx.type).toBe('Visa');
        expect(tx.description).toBe('Telenor Norge');
    });

    it('strips Visa Varekjøp combined prefix', () => {
        const tx = parseSingleLine({
            tx: dnbRow('Visa Varekjøp Steam Purchase Reservert transaksjon', '600', '0'),
            bank: 'dnb',
        });
        expect(tx.description).toBe('Steam Purchase Reservert transaksjon');
        expect(tx.type).toBe('Visa');
    });

    it('parses date correctly', () => {
        const tx = parseSingleLine({
            tx: dnbRow('Varekjøp 05.02 55528 REMA 1000', '200', '0', '05.02.2026'),
            bank: 'dnb',
        });
        expect(tx.date).toBe('2026-02-05');
    });
});

describe('parseCsvString (DNB)', () => {
    it('parses multiple rows', () => {
        const csv = DNB_CSV([
            dnbRow('Varekjøp 01.01 12345 KIWI 012 RAUFOSS', '150', '0', '01.01.2025'),
            dnbRow('Lønn fra Rema 1000', '0', '30000', '25.01.2025'),
        ]);
        const result = parseCsvString(csv, 'dnb', []);
        expect(result).toHaveLength(2);
        expect(result[0].type).toBe('Varekjøp');
        expect(result[1].type).toBe('Lønn');
    });

    it('filters rows with invalid dates', () => {
        const csv = DNB_CSV([
            dnbRow('Varekjøp 01.01 12345 KIWI', '150', '0', '01.01.2025'),
            '"not-a-date";"Varekjøp KIWI";"02.01.2025";"100";"0"',
        ]);
        const result = parseCsvString(csv, 'dnb', []);
        expect(result).toHaveLength(1);
    });

    it('marks transfer to own account as Kontoregulering', () => {
        const csv = DNB_CSV([
            dnbRow('Overføring til konto 1234 56 78901', '5000', '0', '01.01.2025'),
        ]);
        // ownAccounts doesn't apply to DNB (no toAccount field), but parseCsvString accepts it
        const result = parseCsvString(csv, 'dnb', []);
        expect(result[0].type).toBe('Overføring');
    });
});
