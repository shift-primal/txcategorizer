export type Bank = 'dnb' | 'valle';

export type RawTransaction = {
    date: string;
    incoming?: number;
    outgoing?: number;
    description: string;
    currency: string;
    exchangeRate?: number;
    type?: string; // Valle only
    subtype?: string; // Valle only
};

export type FinalTransaction = {
    date: string;
    amount: number;
    type: string;
    merchant: string;
    category: string;
};
