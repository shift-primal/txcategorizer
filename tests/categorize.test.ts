import { describe, it, expect } from 'vitest';
import { categorizeTransactions } from '../src/categorize/engine.js';
import { defaultCategoryKeywords } from '../src/defaults.js';
import type { CategoryKeywords, ExtractedTransaction } from '../src/types.js';

const tx = (merchant: string, counterparty?: string): ExtractedTransaction => ({
    date: '2025-01-01',
    amount: -100,
    merchant,
    type: 'Varekjøp',
    ...(counterparty && { counterparty })
});

const categorize = (merchant: string, keywords: CategoryKeywords = defaultCategoryKeywords) =>
    categorizeTransactions([tx(merchant)], keywords)[0]!.category;

describe('categorizeTransactions', () => {
    it('matches grocery store', () => {
        expect(categorize('Kiwi')).toBe('Dagligvare');
        expect(categorize('Rema 1000')).toBe('Dagligvare');
        expect(categorize('Extra')).toBe('Dagligvare');
    });

    it('matches restaurant', () => {
        expect(categorize("McDonald's")).toBe('Mat ute');
    });

    it('matches gaming', () => {
        expect(categorize('Steam')).toBe('Gaming');
    });

    it('matches subscription', () => {
        expect(categorize('Netflix')).toBe('Abonnement');
        expect(categorize('Google')).toBe('Abonnement');
    });

    it('defaults to Annet for unknown merchant', () => {
        expect(categorize('Ukjent butikk xyz')).toBe('Annet');
    });

    it('does NOT match partial words (word boundary check)', () => {
        // "hm" should not match inside "ahm"
        expect(categorize('Ahm Store', { Netthandel: ['hm'] })).toBe('Annet');
    });

    it('matches on word boundary', () => {
        expect(categorize('Hm Store', { Netthandel: ['hm'] })).toBe('Netthandel');
    });

    it('treats keywords as literal text, not regex', () => {
        // "m.a.p.t" must not match "mxaxpxt" via the dots
        expect(categorize('Mxaxpxt', { 'Klær': ['m.a.p.t'] })).toBe('Annet');
        expect(categorize('M.a.p.t Oslo', { 'Klær': ['m.a.p.t'] })).toBe('Klær');
    });

    it('matches on counterparty as well', () => {
        const result = categorizeTransactions(
            [tx('Betaling', 'Vipps user')],
            { Overføring: ['vipps'] }
        )[0]!;
        expect(result.category).toBe('Overføring');
    });

    it('first matching keyword wins', () => {
        const keywords: CategoryKeywords = {
            Dagligvare: ['rema'],
            Netthandel: ['rema']
        };
        expect(categorize('Rema 1000', keywords)).toBe('Dagligvare');
    });
});
