import { ExtractedTransaction, FinalTransaction } from '../types.js';
import { categoryDict } from './categoryRules.js';

const CATEGORIES = [
    'Dagligvare',
    'Mat ute',
    'Hjem',
    'Underholdning',
    'Gaming',
    'Abonnement',
    'Netthandel',
    'Helse',
    'Kosmetikk',
    'Kreditt',
    'Transport',
    'Bil',
    'Bolig',
    'Boutgifter',
    'Forsikring',
    'Overføring',
    'Inntekt',
    'Sparing',
    'Diverse',
    'Annet',
] as const;

export type Category = (typeof CATEGORIES)[number];

export function categorizeTransactions(txs: ExtractedTransaction[]): FinalTransaction[] {
    return txs.map((t) => {
        const m = `${t.merchant} ${t.counterparty ?? ''}`.toLowerCase();
        let category: Category = 'Annet';
        for (const [keyword, cat] of categoryDict) {
            if (m.includes(keyword)) {
                category = cat;
                break;
            }
        }
        return { ...t, category };
    });
}
