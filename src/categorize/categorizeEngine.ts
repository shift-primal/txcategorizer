import { Category } from '../categories.js';
import { ExtractedTransaction, Transaction } from '../types.js';

export function categorizeTransactions(
    txs: ExtractedTransaction[],
    categoryKeywords: Partial<Record<Category, string[]>>
): Transaction[] {
    const dict = new Map(
        Object.entries(categoryKeywords).flatMap(([category, keywords]) =>
            keywords!.map((k) => [
                new RegExp(`(?<![a-zA-Z0-9æøåÆØÅ])${k}(?![a-zA-Z0-9æøåÆØÅ])`, 'i'),
                category as Category
            ])
        )
    );

    return txs.map((t) => {
        const m = `${t.merchant} ${t.counterparty ?? ''}`.toLowerCase();
        let category: Category = 'Annet';
        for (const [pattern, cat] of dict) {
            if (pattern.test(m)) {
                category = cat;
                break;
            }
        }
        return { ...t, category };
    });
}
