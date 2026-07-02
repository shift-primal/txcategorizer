import type { Category } from "./categories.js";

export const BANKS = ["dnb", "valle"] as const;

/** Supported bank export formats. */
export type Bank = (typeof BANKS)[number];

export const TRANSACTION_TYPES = [
	"Varekjøp", // card purchase (in-store or online)
	"Visa", // foreign/online card
	"Betaling",
	"Giro",
	"Overføring", // transfers (including Straksbetaling)
	"Lønn",
	"Kontoregulering",
	"Nedbetaling",
	"Renter",
	"Omkostninger",
	"Annet",
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/** Currency info. Only present on the final transaction for non-NOK amounts. */
export type Valuta = {
	currency: string;
	exchangeRate: number;
};

/** Raw merchant name → normalized name. Keys are lowercase prefix matches. */
export type MerchantAliases = Record<string, string>;

/** Keywords (word-boundary matched) mapped to categories. */
export type CategoryKeywords = Partial<Record<Category, string[]>>;

/** What a merchant rule extracts from a raw transaction. */
export type MerchantExtraction = {
	merchant: string;
	counterparty?: string;
	raw?: string;
};

/** A merchant extraction rule: the first rule whose `match` returns true wins. */
export type MerchantRule = {
	match: (tx: RawTransaction) => boolean;
	extract: (tx: RawTransaction) => MerchantExtraction;
};

export type Options = {
	/** Normalize raw merchant names. Keys are lowercase prefix matches. */
	merchantAliases?: MerchantAliases;
	/** Keywords (word-boundary matched) mapped to categories. Replaces the defaults. */
	categoryKeywords?: CategoryKeywords;
	/** Account numbers that identify transfers to your own accounts. */
	ownAccounts?: string[];
	/** City names that prefix merchant names in card transactions. */
	cityPrefixes?: string[];
	/** Multi-word merchant names. Key = first word, value = total word count. */
	nWordMerchants?: Record<string, number>;
	/** Pattern to strip from company names (e.g. " As", " Asa"). */
	corporateSuffixPattern?: RegExp;
	/** Fully replace the built-in extraction rules. */
	extractionRules?: MerchantRule[];
	/** Adds the original description as `raw` and logs skipped rows. */
	debug?: boolean;
};

/** Options with all defaults applied (except `extractionRules`, which has none). */
export type ResolvedOptions = Required<Omit<Options, "extractionRules">> &
	Pick<Options, "extractionRules">;

/** A transaction as parsed from the CSV, before merchant extraction. */
export type RawTransaction = {
	date: string;
	description: string;
	amount: number;
	valuta: Valuta;
	type: TransactionType;
	rawType?: string;
};

/** A transaction after merchant extraction, before categorization. */
export type ExtractedTransaction = {
	/** ISO date, e.g. "2025-12-31" */
	date: string;
	/** Negative = expense, positive = income */
	amount: number;
	merchant: string;
	type: TransactionType;
	/** Other party for transfers/Vipps, e.g. "Morten Haugen" */
	counterparty?: string;
	/** Only present for non-NOK transactions */
	valuta?: Valuta;
	/** Original description (debug mode only) */
	raw?: string;
};

export type Transaction = ExtractedTransaction & { category: Category };
