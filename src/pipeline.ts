import { parseCsvString } from './parse/csv\.js';
import { extractMerchants } from './extract/extractEngine\.js';
import { categorizeTransactions } from './categorize/categorizeEngine\.js';
import { Bank, FinalTransaction } from './types\.js';

export function processTransactions(content: string, bank: Bank): FinalTransaction[] {
    return categorizeTransactions(extractMerchants(parseCsvString(content, bank)));
}
