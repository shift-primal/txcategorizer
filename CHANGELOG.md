# Changelog

## 1.0.0 (2026-07-02)

First stable release. Same core idea as 0.x — CSV/txt file in, categorized transactions out — with a fully typed, cleaned-up API.

### Breaking changes

- `Options.locale` removed (it was never used).
- `extractMerchants` now takes `(transactions, resolvedOptions)` instead of seven positional arguments. Use `resolveOptions(options)` to build the second argument.
- `parseCsvString` / `parseSingleLine` replaced by `parseCsv(content, bank, resolvedOptions)`.
- Unknown transaction types are normalized to `'Annet'` instead of being passed through unchecked.
- Category keywords are now matched as literal text (regex characters are escaped), so keywords like `m.a.p.t` no longer match unintended strings.
- Skipped-row warnings are only logged when `debug: true`.
- `valuta` and `raw` keys are omitted from results instead of being present with `undefined`.

### Added

- `BANKS` and `TRANSACTION_TYPES` runtime constants (with `Bank` / `TransactionType` derived from them).
- `resolveOptions`, `parseCsv`, `extractMerchants`, `categorizeTransactions`, and `createMerchantRules` exported for step-by-step use.
- All defaults exported (`defaultMerchantAliases`, `defaultCategoryKeywords`, `defaultOptions`, …).
- `Valuta`, `MerchantExtraction`, `ResolvedOptions` types exported.
- Amount parsing handles Norwegian number formats (`"1 234,56"`).
- Typed CSV parsing via `@types/papaparse`; strict compiler settings (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`).

### Removed

- `date-fns` dependency (date reformatting is done inline).

### Fixed

- `exports` map in package.json listed `types` last, breaking type resolution for some bundler/TS configurations.
