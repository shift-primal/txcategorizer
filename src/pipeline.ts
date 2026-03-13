import { categorizeTransactions } from './categorize/categorizeEngine.js';
import { defaultOptions } from './defaultOptions.js';
import { extractMerchants } from './extract/extractEngine.js';
import { parseCsvString } from './parse/csv.js';
import { Bank, Transaction, Options } from './types.js';

export function processTransactions(
    content: string | ArrayBuffer,
    bank: Bank,
    options?: Options,
): Transaction[] {
    const opts = {
        ...defaultOptions,
        ...options,
        ownAccounts: options?.ownAccounts ?? defaultOptions.ownAccounts,
    };

    if (!content) throw new Error('[txcategorizer] content is empty');
    if (bank !== 'dnb' && bank !== 'valle')
        throw new Error(`[txcategorizer] unknown bank: ${bank}`);

    const text =
        typeof content === 'string'
            ? content
            : new TextDecoder(bank === 'valle' ? 'windows-1252' : 'utf-8').decode(content);

    const raw = parseCsvString(text, bank, opts.ownAccounts);
    const extracted = extractMerchants(
        raw,
        opts.merchantAliases,
        opts.extractionRules,
        opts.cityPrefixes,
        opts.nWordMerchants,
        opts.corporateSuffixPattern,
        opts.debug,
    );
    return categorizeTransactions(extracted, opts.categoryKeywords);
}
