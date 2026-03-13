import { describe, it, expect } from 'vitest';
import { categorizeTransactions } from '../categorize/categorizeEngine.js';
import { defaultCategoryKeywords } from '../defaultOptions.js';
import type { ExtractedTransaction } from '../types.js';

const tx = (merchant: string, counterparty?: string): ExtractedTransaction => ({
    date: '2025-01-01',
    amount: -100,
    merchant,
    counterparty,
    type: 'Varekjøp',
});

const categorize = (merchant: string, counterparty?: string) =>
    categorizeTransactions([tx(merchant, counterparty)], defaultCategoryKeywords)[0].category;

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
        // "hm" should not match "ahm" or "thm"
        const keywords = { Netthandel: ['hm'] };
        const result = categorizeTransactions([tx('Ahm Store')], keywords)[0];
        expect(result.category).toBe('Annet');
    });

    it('matches on word boundary', () => {
        const keywords = { Netthandel: ['hm'] };
        const result = categorizeTransactions([tx('Hm Store')], keywords)[0];
        expect(result.category).toBe('Netthandel');
    });

    it('matches on counterparty as well', () => {
        const keywords = { Overføring: ['vipps'] };
        const result = categorizeTransactions([tx('Betaling', 'Vipps user')], keywords)[0];
        expect(result.category).toBe('Overføring');
    });

    it('first matching keyword wins', () => {
        const keywords = {
            Dagligvare: ['rema'],
            Netthandel: ['rema'],
        };
        const result = categorizeTransactions([tx('Rema 1000')], keywords)[0];
        expect(result.category).toBe('Dagligvare');
    });
});
