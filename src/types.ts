export type Bank = 'dnb' | 'valle';

export type RawTransaction = {
    date: string;
    description: string;
    amount: number;
    currency: string; // default 'NOK'
    exchangeRate: number; // default 1
    type?: string; // Valle only
    counterparty?: string;
};

export type FinalTransaction = {
    date: string;
    amount: number;
    merchant: string;
    category: string;
};
