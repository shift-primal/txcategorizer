import type { Category } from "../categories.js";
import type {
	CategoryKeywords,
	ExtractedTransaction,
	Transaction,
} from "../types.js";

const escapeRegExp = (value: string): string =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const WORD_CHARS = "a-zA-Z0-9æøåÆØÅ";

type Matcher = { pattern: RegExp; category: Category };

/** Keyword order matters: the first matching keyword wins. */
export function categorizeTransactions(
	txs: ExtractedTransaction[],
	categoryKeywords: CategoryKeywords,
): Transaction[] {
	const matchers: Matcher[] = Object.entries(categoryKeywords).flatMap(
		([category, keywords]) =>
			(keywords ?? []).map((keyword) => ({
				pattern: new RegExp(
					`(?<![${WORD_CHARS}])${escapeRegExp(keyword)}(?![${WORD_CHARS}])`,
					"i",
				),
				category: category as Category,
			})),
	);

	return txs.map((tx) => {
		if (tx.type === "Lønn") return { ...tx, category: "Inntekt" };

		const haystack = `${tx.merchant} ${tx.counterparty ?? ""}`;
		const category =
			matchers.find(({ pattern }) => pattern.test(haystack))?.category ??
			"Annet";

		return { ...tx, category };
	});
}
