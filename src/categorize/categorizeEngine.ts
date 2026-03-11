import { Category } from '../categories.js';
import { ExtractedTransaction, FinalTransaction } from '../types.js';

export function categorizeTransactions(
    txs: ExtractedTransaction[],
    categoryKeywords: Partial<Record<Category, string[]>>,
): FinalTransaction[] {
    const dict = new Map(
        Object.entries(categoryKeywords).flatMap(([category, keywords]) =>
            keywords!.map((k) => [k, category as Category]),
        ),
    );

    return txs.map((t) => {
        const m = `${t.merchant} ${t.counterparty ?? ''}`.toLowerCase();
        let category: Category = 'Annet';
        for (const [keyword, cat] of dict) {
            if (m.includes(keyword)) {
                category = cat;
                break;
            }
        }
        return { ...t, category };
    });
}
