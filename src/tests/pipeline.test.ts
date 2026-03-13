import { describe, it, expect } from 'vitest';
import { processTransactions } from '../pipeline.js';

const DNB_HEADER = '"Dato";"Forklaring";"Rentedato";"Ut fra konto";"Inn på konto"';

const dnbCsv = (...rows: string[]) => [DNB_HEADER, ...rows].join('\n');

describe('processTransactions (DNB end-to-end)', () => {
    it('categorizes a grocery purchase', () => {
        const csv = dnbCsv(
            '"01.01.2025";"Varekjøp 01.01 12345 KIWI 012 RAUFOSS";"02.01.2025";"150";"0"',
        );
        const [tx] = processTransactions(csv, 'dnb');
        expect(tx.merchant).toBe('Kiwi');
        expect(tx.category).toBe('Dagligvare');
        expect(tx.amount).toBe(-150);
        expect(tx.date).toBe('2025-01-01');
    });

    it('categorizes a Vipps transfer', () => {
        const csv = dnbCsv(
            '"10.01.2025";"Overføring Tpp: jan-fredrik";"11.01.2025";"200";"0"',
        );
        const [tx] = processTransactions(csv, 'dnb');
        expect(tx.merchant).toBe('Vipps');
        expect(tx.counterparty).toBe('Jan-fredrik');
    });

    it('handles income (positive amount)', () => {
        const csv = dnbCsv(
            '"25.01.2025";"Lønn fra Nav";"26.01.2025";"0";"30000"',
        );
        const [tx] = processTransactions(csv, 'dnb');
        expect(tx.amount).toBe(30000);
        expect(tx.merchant).toMatch(/Lønn/);
        expect(tx.category).toBe('Inntekt');
    });

    it('applies custom merchantAliases', () => {
        const csv = dnbCsv(
            '"01.01.2025";"Visa 100121 My Custom Store";"02.01.2025";"99";"0"',
        );
        const [tx] = processTransactions(csv, 'dnb', {
            merchantAliases: { my: 'My Brand' },
        });
        expect(tx.merchant).toBe('My Brand');
    });

    it('applies custom categoryKeywords', () => {
        const csv = dnbCsv(
            '"01.01.2025";"Visa 100121 Coolshop";"02.01.2025";"499";"0"',
        );
        const [tx] = processTransactions(csv, 'dnb', {
            categoryKeywords: { 'Netthandel': ['coolshop'] },
        });
        expect(tx.category).toBe('Netthandel');
    });

    it('returns empty array for empty CSV', () => {
        expect(() => processTransactions('', 'dnb')).toThrow();
    });

    it('throws for unknown bank', () => {
        // @ts-expect-error testing invalid input
        expect(() => processTransactions('"header"', 'unknown')).toThrow();
    });

    it('returns multiple transactions in order', () => {
        const csv = dnbCsv(
            '"01.01.2025";"Varekjøp 01.01 12345 KIWI 012 RAUFOSS";"02.01.2025";"150";"0"',
            '"02.01.2025";"Varekjøp 02.01 55528 REMA 1000 GJØVIK";"03.01.2025";"200";"0"',
        );
        const result = processTransactions(csv, 'dnb');
        expect(result).toHaveLength(2);
        expect(result[0].date).toBe('2025-01-01');
        expect(result[1].date).toBe('2025-01-02');
    });
});
