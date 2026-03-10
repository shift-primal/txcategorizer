import { ExtractedTransaction, FinalTransaction } from '@/types.ts';
import { categoryDict } from './categoryRules.ts';

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
        const m = t.merchant.toLowerCase();
        let category: Category = 'Annet';
        for (const [keyword, cat] of Object.entries(categoryDict)) {
            if (m.includes(keyword)) {
                category = cat;
                break;
            }
        }
        return { ...t, category };
    });
}
