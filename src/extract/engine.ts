import { RawTransaction } from '../parse/csv.ts';
import { capFirstChar } from '../util/extractHelpers.ts';
import { merchantDict } from './nmdict.ts';
import { merchantRules as rules } from './rules.ts';

export function extractMerchants(txs: RawTransaction[]) {
    return txs.map((tx) => {
        const rule = rules.find((r) => r.match(tx));
        const extracted = rule ? rule.extract(tx) : { merchant: tx.description.trim() };
        const merchant =
            merchantDict[extracted.merchant.toLowerCase()] ??
            capFirstChar(extracted.merchant.toLowerCase());
        return { ...extracted, merchant };
    });
}
