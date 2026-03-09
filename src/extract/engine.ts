import { RawTransaction } from '../parse/csv.ts';
import { capFirstChar } from '../util/extractHelpers.ts';
import { merchantRules as rules, merchantDict as nmDict } from './rules.ts';

export function extractMerchants(txs: RawTransaction[]) {
    return txs.map((tx) => {
        const rule = rules.find((r) => r.match(tx));
        const extracted = rule ? rule.extract(tx) : { merchant: tx.description.trim() };
        const merchant =
            nmDict[extracted.merchant.toLowerCase()] ??
            capFirstChar(extracted.merchant.toLowerCase());
        return { ...extracted, merchant, type: tx.type };
    });
}
