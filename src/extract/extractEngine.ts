import { capFirstChar } from './extractHelpers.js';
import {
    defaultCityPrefixes,
    defaultCorporateSuffixPattern,
    defaultNWordMerchants,
} from '../defaultOptions.js';
import { createMerchantRules, MerchantRule } from './extractRules.js';
import { ExtractedTransaction, RawTransaction } from '../types.js';

export function extractMerchants(
    txs: RawTransaction[],
    merchantAliases: Record<string, string>,
    extractionRules?: MerchantRule[],
    cityPrefixes: string[] = defaultCityPrefixes,
    nWordMerchants: Record<string, number> = defaultNWordMerchants,
    corporateSuffixPattern: RegExp = defaultCorporateSuffixPattern,
    debug = false,
): ExtractedTransaction[] {
    const rules =
        extractionRules ??
        createMerchantRules(cityPrefixes, nWordMerchants, corporateSuffixPattern, debug);
    return txs.map((tx) => {
        const rule = rules.find((r) => r.match(tx));
        const extracted = rule ? rule.extract(tx) : { merchant: tx.description.trim() };
        const rawMerchant = extracted.merchant
            .replace(/\s+\d{2,4}$/, '')
            .replace(/\s+\b(as|asa|ab|ltd|sa)\b\.?$/i, '')
            .trim();
        if (!rawMerchant) {
            return {
                date: tx.date,
                amount: tx.amount,
                merchant: 'Ukjent',
                valuta: tx.valuta.currency !== 'NOK' ? tx.valuta : undefined,
                counterparty: undefined,
                type: tx.type,
                raw: extracted.raw,
            };
        }
        const aliasKey = Object.keys(merchantAliases).find((k) =>
            rawMerchant.toLowerCase().startsWith(k),
        );
        const merchant = aliasKey
            ? merchantAliases[aliasKey]
            : capFirstChar(rawMerchant.toLowerCase());
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
