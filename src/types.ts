import { Category } from './categories.js';
import type { MerchantRule } from './extract/extractRules.js';

export type Bank = 'dnb' | 'valle';

type Valuta = {
    currency: string;
    exchangeRate: number;
};

export type CategoryKeywords = Record<Category, string[]>;
export type MerchantAliases = Record<string, string>;

export type Options = {
    merchantAliases?: Record<string, string>;
    categoryKeywords?: Partial<Record<Category, string[]>>;
    ownAccounts?: string[];
    cityPrefixes?: string[];
    nWordMerchants?: Record<string, number>;
    corporateSuffixPattern?: RegExp;
    locale?: Intl.Locale;
    debug?: boolean;
    extractionRules?: MerchantRule[];
};

export type TransactionType =
    | 'Varekjøp' // card purchase (in-store or online)
    | 'Visa' // foreign/online card
    | 'Betaling'
    | 'Giro'
    | 'Overføring' // transfers (including Straksbetaling)
    | 'Lønn'
    | 'Kontoregulering'
    | 'Nedbetaling'
    | 'Renter'
    | 'Omkostninger'
    | 'Annet';

export type RawTransaction = {
    date: string;
    description: string;
    amount: number;
    valuta: Valuta;
    type?: TransactionType;
    rawType?: string;
    counterparty?: string;
};

export type ExtractedTransaction = {
    date: string;
    amount: number;
    merchant: string;
    valuta?: Valuta;
    type?: TransactionType;
    counterparty?: string;
    raw?: string;
};

export type Transaction = ExtractedTransaction & { category: Category };
