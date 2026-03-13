import { describe, it, expect } from 'vitest';
import { extractMerchants } from '../extract/extractEngine.js';
import { defaultMerchantAliases } from '../defaultOptions.js';
import type { RawTransaction } from '../types.js';

const tx = (overrides: Partial<RawTransaction>): RawTransaction => ({
    date: '2025-01-01',
    amount: -100,
    description: '',
    valuta: { currency: 'NOK', exchangeRate: 1 },
    type: 'Varekjøp',
    ...overrides,
});

const extract = (overrides: Partial<RawTransaction>) =>
    extractMerchants([tx(overrides)], defaultMerchantAliases)[0];

describe('extractMerchants — Varekjøp', () => {
    it('takes first word as merchant', () => {
        const r = extract({ description: 'KIWI 012 RAUFOSS STORGATA' });
        expect(r.merchant).toBe('Kiwi');
    });

    it('handles nWordMerchant (Burger King → 2 words)', () => {
        const r = extract({ description: 'Burger King Gjøvik' });
        expect(r.merchant).toBe('Burger King');
    });

    it('strips city prefix and takes next word', () => {
        const r = extract({ description: 'Gjøvik Specsavers Optikk', type: 'Varekjøp' });
        expect(r.merchant).toBe('Specsavers');
    });

    it('parses date_storecode_merchant pattern', () => {
        const r = extract({ description: '20/11_55528_circle_k' });
        expect(r.merchant).toBe('Circle K');
    });

    it('extracts merchant after * separator', () => {
        const r = extract({ description: 'Klarna*VERO MODA' });
        expect(r.merchant).toBe('Vero Moda');
    });
});

describe('extractMerchants — Visa', () => {
    it('extracts Vipps counterparty', () => {
        const r = extract({ type: 'Visa', description: 'Vipps:vipps:jan-fredrik b' });
        expect(r.merchant).toBe('Vipps');
        expect(r.counterparty).toBe('Jan-fredrik B');
    });

    it('extracts Paypal + counterparty', () => {
        const r = extract({ type: 'Visa', description: 'Paypal :discord' });
        expect(r.merchant).toBe('Paypal');
        expect(r.counterparty).toBe('Discord');
    });

    it('extracts Zettle merchant after :', () => {
        const r = extract({ type: 'Visa', description: 'Zettle_:waffle house' });
        expect(r.merchant).toBe('Waffle House');
    });

    it('keeps city + next word for Visa city-prefix', () => {
        const r = extract({ type: 'Visa', description: 'Moelv Tatovering' });
        expect(r.merchant).toBe('Moelv Tatovering');
    });

    it('takes first word for generic Visa', () => {
        const r = extract({ type: 'Visa', description: 'Telenor Norge AS' });
        expect(r.merchant).toBe('Telenor');
    });

    it('strips :suffix from Visa merchant', () => {
        const r = extract({ type: 'Visa', description: 'Revolut::1154:' });
        expect(r.merchant).toBe('Revolut');
    });
});

describe('extractMerchants — Overføring', () => {
    it('extracts counterparty for regular transfer', () => {
        const r = extract({
            type: 'Overføring',
            description: 'Haakon Paulsen (12066464367)',
        });
        expect(r.merchant).toBe('Overføring');
        expect(r.counterparty).toBe('Haakon Paulsen');
    });

    it('marks Tpp: as Vipps', () => {
        const r = extract({
            type: 'Overføring',
            description: 'Tpp: jan-fredrik',
        });
        expect(r.merchant).toBe('Vipps');
    });

    it('marks Straksbetaling as Vipps', () => {
        const r = extract({
            type: 'Overføring',
            rawType: 'Straksbetaling',
            description: 'Jan Fredrik',
        });
        expect(r.merchant).toBe('Vipps');
    });

    it('keeps Overføring for Straksbetaling with Til konto:', () => {
        const r = extract({
            type: 'Overføring',
            rawType: 'Straksbetaling',
            description: 'Til konto: 2890 81 74710',
        });
        expect(r.merchant).toBe('Overføring');
    });

    it('splits counterparty on Betaling keyword', () => {
        const r = extract({
            type: 'Overføring',
            description: 'Anna Huset Linde Betaling Tpp: Vipps Mobilepay AS',
        });
        expect(r.counterparty).toBe('Anna Huset');
    });
});

describe('extractMerchants — Giro', () => {
    it('extracts company from Efaktura', () => {
        const r = extract({
            type: 'Giro',
            description: 'Telenor Norge As, Mobil Efaktura',
        });
        expect(r.merchant).toBe('Telenor');
    });

    it('treats 3-word name as person → Overføring', () => {
        const r = extract({
            type: 'Giro',
            description: 'Sindre Hakkeseth Branden',
        });
        expect(r.merchant).toBe('Overføring');
        expect(r.counterparty).toBe('Sindre Hakkeseth Branden');
    });

    it('keeps company name as merchant', () => {
        const r = extract({
            type: 'Giro',
            description: 'Gjensidige Forsikring Asa (60050608460)',
        });
        expect(r.merchant).toBe('Gjensidige');
    });
});

describe('extractMerchants — Betaling', () => {
    it('treats 3-word name as person → Betaling + counterparty', () => {
        const r = extract({
            type: 'Betaling',
            description: 'Abdul Mohammed Haugen (12063188240)',
        });
        expect(r.merchant).toBe('Betaling');
        expect(r.counterparty).toBe('Abdul Mohammed Haugen');
    });

    it('uses company name as merchant', () => {
        const r = extract({
            type: 'Betaling',
            description: 'Verisure As (17108281812)',
        });
        expect(r.merchant).toBe('Verisure');
    });
});

describe('extractMerchants — aliases', () => {
    it('applies merchant alias', () => {
        const r = extractMerchants([tx({ description: 'Mcdonald S Hamar', type: 'Varekjøp' })], {
            mcdonald: "McDonald's",
        })[0];
        expect(r.merchant).toBe("McDonald's");
    });
});
