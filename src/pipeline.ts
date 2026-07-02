import { categorizeTransactions } from './categorize/engine.js';
import { resolveOptions } from './defaults.js';
import { extractMerchants } from './extract/engine.js';
import { bankConfigs, parseCsv } from './parse/csv.js';
import { BANKS } from './types.js';
import type { Bank, Options, Transaction } from './types.js';

/**
 * Parse a bank CSV export into categorized transactions.
 *
 * `content` can be a string or a raw `ArrayBuffer`; buffers are decoded
 * with the bank's encoding (Valle exports are Windows-1252).
 */
export function processTransactions(
    content: string | ArrayBuffer,
    bank: Bank,
    options?: Options
): Transaction[] {
    if (!BANKS.includes(bank)) {
        throw new Error(`[txcategorizer] unknown bank: ${String(bank)}`);
    }

    const text =
        typeof content === 'string'
            ? content
            : new TextDecoder(bankConfigs[bank].encoding).decode(content);

    if (!text.trim()) throw new Error('[txcategorizer] content is empty');

    const resolved = resolveOptions(options);

    const raw = parseCsv(text, bank, resolved);
    const extracted = extractMerchants(raw, resolved);
    return categorizeTransactions(extracted, resolved.categoryKeywords);
}
