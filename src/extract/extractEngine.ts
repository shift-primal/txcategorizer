import { capFirstChar } from '../util/extractHelpers.js';
import { merchantRules as rules, merchantDict as nmDict } from './extractRules.js';
import { ExtractedTransaction, RawTransaction } from '../types.js';

export function extractMerchants(txs: RawTransaction[]): ExtractedTransaction[] {
    return txs.map((tx) => {
        const rule = rules.find((r) => r.match(tx));
        const extracted = rule ? rule.extract(tx) : { merchant: tx.description.trim() };
        const rawMerchant = extracted.merchant.replace(/\s+\d{2,4}$/, '').trim();
        const merchant =
            nmDict[rawMerchant.toLowerCase()] ?? capFirstChar(rawMerchant.toLowerCase());
        const counterparty = extracted.counterparty
            ? capFirstChar(extracted.counterparty.toLowerCase())
            : undefined;
        return {
            date: tx.date,
            amount: tx.amount,
            merchant: merchant,
            valuta: tx.valuta.currency !== 'NOK' ? tx.valuta : undefined,
            counterparty: counterparty,
            type: tx.type,
            raw: extracted.raw,
        };
    });
}
