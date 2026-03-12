export { processTransactions } from './pipeline.js';
export { type Category, CATEGORIES } from './categories.js';
export type { MerchantRule } from './extract/extractRules.js';
export {
    defaultCityPrefixes,
    defaultNWordMerchants,
    defaultCorporateSuffixPattern,
} from './defaultOptions.js';

export type {
    FinalTransaction,
    ExtractedTransaction,
    RawTransaction,
    Bank,
    TransactionType,
    Options,
    CategoryKeywords,
    MerchantAliases,
} from './types.js';

export function decodeWindows1252(buffer: ArrayBuffer): string {
    return new TextDecoder('windows-1252').decode(buffer);
}
