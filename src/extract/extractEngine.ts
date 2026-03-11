import { capFirstChar } from './extractHelpers.js';
import { merchantRules as defaultRules, MerchantRule } from './extractRules.js';
import { ExtractedTransaction, RawTransaction } from '../types.js';

export function extractMerchants(
    txs: RawTransaction[],
    merchantAliases: Record<string, string>,
    extractionRules?: MerchantRule[],
): ExtractedTransaction[] {
    const rules = extractionRules ?? defaultRules;
    return txs.map((tx) => {
        const rule = rules.find((r) => r.match(tx));
        const extracted = rule ? rule.extract(tx) : { merchant: tx.description.trim() };
        const rawMerchant = extracted.merchant.replace(/\s+\d{2,4}$/, '').trim();
        const merchant =
            merchantAliases[rawMerchant.toLowerCase()] ?? capFirstChar(rawMerchant.toLowerCase());
        const counterparty = extracted.counterparty
            ? capFirstChar(extracted.counterparty.toLowerCase())
            : undefined;
        return {
            date: tx.date,
            amount: tx.amount,
            merchant,
            valuta: tx.valuta.currency !== 'NOK' ? tx.valuta : undefined,
            counterparty,
            type: tx.type,
            raw: extracted.raw,
        };
    });
}
