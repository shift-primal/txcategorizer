import { RawTransaction } from '../parse/csv.ts';

export type CategoryRule = {
    match: (tx: RawTransaction) => boolean;
    merchant: (tx: RawTransaction) => string;
    category: string;
};

const rules: CategoryRule[] = [];
