export { processTransactions } from './pipeline.js';

export { CATEGORIES, type Category } from './categories.js';
export { BANKS, TRANSACTION_TYPES } from './types.js';

export { categorizeTransactions } from './categorize/engine.js';
export { extractMerchants } from './extract/engine.js';
export { createMerchantRules } from './extract/rules.js';
export { parseCsv } from './parse/csv.js';

export {
    defaultCategoryKeywords,
    defaultCityPrefixes,
    defaultCorporateSuffixPattern,
    defaultMerchantAliases,
    defaultNWordMerchants,
    defaultOptions,
    resolveOptions
} from './defaults.js';

export type {
    Bank,
    CategoryKeywords,
    ExtractedTransaction,
    MerchantAliases,
    MerchantExtraction,
    MerchantRule,
    Options,
    RawTransaction,
    ResolvedOptions,
    Transaction,
    TransactionType,
    Valuta
} from './types.js';

/** Decode a Windows-1252 buffer (the encoding Valle exports use). */
export function decodeWindows1252(buffer: ArrayBuffer): string {
    return new TextDecoder('windows-1252').decode(buffer);
}
