import { Category } from './categorize/categorizeEngine.ts';

export type Bank = 'dnb' | 'valle';

type Valuta = {
    currency: string;
    exchangeRate: number;
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
    counterparty?: string;
};

export type ExtractedTransaction = {
    date: string;
    amount: number;
    merchant: string;
    valuta: Valuta;
    type?: TransactionType;
    counterparty?: string;
    raw?: string;
};

export type FinalTransaction = ExtractedTransaction & { category: Category };
