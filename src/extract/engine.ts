import type { ExtractedTransaction, RawTransaction, ResolvedOptions } from '../types.js';
import { titleCase } from './helpers.js';
import { createMerchantRules } from './rules.js';

// "www.silverlines.no" → "silverlines"
const stripWww = (value: string): string => value.replace(/\bwww\.([^.\s]+)\.\S*/gi, '$1').trim();

export function extractMerchants(
    txs: RawTransaction[],
    options: ResolvedOptions
): ExtractedTransaction[] {
    const rules = options.extractionRules ?? createMerchantRules(options);
    const aliases = Object.entries(options.merchantAliases);

    const normalizeName = (name: string): string => {
        const alias = aliases.find(([key]) => name.toLowerCase().startsWith(key));
        return alias ? alias[1] : titleCase(name);
    };

    return txs.map((tx) => {
        const rule = rules.find((r) => r.match(tx));
        const extracted = rule ? rule.extract(tx) : { merchant: tx.description.trim() };

        const base: Omit<ExtractedTransaction, 'merchant'> = {
            date: tx.date,
            amount: tx.amount,
            type: tx.type,
            ...(tx.valuta.currency !== 'NOK' && { valuta: tx.valuta }),
            ...(extracted.raw !== undefined && { raw: extracted.raw })
        };

        const rawMerchant = stripWww(
            extracted.merchant
                .replace(/\s+\d{2,4}$/, '')
                .replace(/\s+\b(as|asa|ab|ltd|sa)\b\.?$/i, '')
        );

        if (!rawMerchant) return { ...base, merchant: 'Ukjent' };

        const rawCounterparty = extracted.counterparty && stripWww(extracted.counterparty);

        return {
            ...base,
            merchant: normalizeName(rawMerchant),
            ...(rawCounterparty && { counterparty: normalizeName(rawCounterparty) })
        };
    });
}
