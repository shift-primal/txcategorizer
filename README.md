# txcategorizer

Parse and categorize Norwegian bank transaction exports (DNB and Valle) into structured, fully typed data. CSV in, transactions out.

[NPM Package](https://www.npmjs.com/package/txcategorizer)

## Install

```bash
pnpm add txcategorizer
```

## Basic usage

```ts
import { processTransactions } from 'txcategorizer';

const result = processTransactions(csvContent, 'dnb');
```

`csvContent` can be a `string` or `ArrayBuffer`. Buffers are decoded with the bank's encoding automatically — Valle exports use Windows-1252, so pass the raw `ArrayBuffer` and the library handles it.

```ts
// Reading a file in Node.js
import { readFileSync } from 'fs';

const buffer = readFileSync('transactions.csv').buffer;
const result = processTransactions(buffer, 'valle');
```

Each result item is a `Transaction`:

```ts
type Transaction = {
    date: string; // "2025-12-31"
    amount: number; // negative = expense, positive = income
    merchant: string; // "REMA 1000"
    type: TransactionType; // "Varekjøp"
    category: Category; // "Dagligvare"
    counterparty?: string; // "Sofie Krukhaug" (for transfers/Vipps)
    valuta?: Valuta; // only present for non-NOK transactions
    raw?: string; // original description (debug mode only)
};
```

## Options

All options are optional — the defaults work out of the box.

```ts
const result = processTransactions(csvContent, 'dnb', {
    merchantAliases: { rema: 'REMA 1000' },
    categoryKeywords: { Dagligvare: ['rema', 'kiwi', 'extra'] },
    ownAccounts: ['1234 56 78901'],
    cityPrefixes: ['Oslo', 'Bergen'],
    nWordMerchants: { Burger: 2, Salt: 3 },
    corporateSuffixPattern: /\s+(as|asa)\b.*$/i,
    debug: false,
});
```

| Option                   | Type                                  | Description                                                                                    |
| ------------------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `merchantAliases`        | `MerchantAliases`                     | Normalize raw merchant names. Keys are lowercase prefix matches.                               |
| `categoryKeywords`       | `CategoryKeywords`                    | Keywords (word-boundary matched, escaped as literal text) mapped to categories.                |
| `ownAccounts`            | `string[]`                            | Account numbers that identify transfers to your own accounts → type becomes `Kontoregulering`. |
| `cityPrefixes`           | `string[]`                            | City names that prefix merchant names in card transactions (e.g. `"Gjøvik Specsave"`).         |
| `nWordMerchants`         | `Record<string, number>`              | Multi-word merchant names. Key = first word, value = total word count to capture.              |
| `corporateSuffixPattern` | `RegExp`                              | Pattern to strip from company names (e.g. `" As"`, `" Asa"`).                                  |
| `extractionRules`        | `MerchantRule[]`                      | Fully replace the built-in extraction rules with your own.                                     |
| `debug`                  | `boolean`                             | Adds `raw` field with original description to each transaction and logs skipped rows.         |

### Extending defaults

Options replace the defaults. To add entries on top of them, spread the exported defaults:

```ts
import {
    processTransactions,
    defaultCityPrefixes,
    defaultNWordMerchants,
    defaultMerchantAliases,
} from 'txcategorizer';

const result = processTransactions(csvContent, 'dnb', {
    cityPrefixes: [...defaultCityPrefixes, 'Hamar', 'Lillehammer'],
    nWordMerchants: { ...defaultNWordMerchants, Little: 2 },
    merchantAliases: { ...defaultMerchantAliases, rema: 'REMA 1000' },
});
```

All defaults are exported: `defaultMerchantAliases`, `defaultCategoryKeywords`, `defaultCityPrefixes`, `defaultNWordMerchants`, `defaultCorporateSuffixPattern`, and `defaultOptions`.

## Custom extraction rules

For full control over merchant extraction, provide your own `extractionRules`. Each rule has a `match` predicate and an `extract` function; the first matching rule wins:

```ts
import { processTransactions, type MerchantRule } from 'txcategorizer';

const myRules: MerchantRule[] = [
    {
        match: ({ type }) => type === 'Varekjøp',
        extract: ({ description }) => ({
            merchant: description.split(/\s+/)[0] ?? '',
        }),
    },
];

const result = processTransactions(csvContent, 'dnb', {
    extractionRules: myRules,
});
```

To build on the built-in rules instead of replacing them, use `createMerchantRules`:

```ts
import { createMerchantRules } from 'txcategorizer';

const rules = [...myRules, ...createMerchantRules()];
```

## Pipeline steps

The individual pipeline stages are exported for advanced use:

```ts
import { parseCsv, extractMerchants, categorizeTransactions, resolveOptions } from 'txcategorizer';

const options = resolveOptions({ debug: true });
const raw = parseCsv(csvText, 'dnb', options); // RawTransaction[]
const extracted = extractMerchants(raw, options); // ExtractedTransaction[]
const transactions = categorizeTransactions(extracted, options.categoryKeywords); // Transaction[]
```

## Categories

```ts
import { CATEGORIES, type Category } from 'txcategorizer';
```

The 21 built-in categories:

`Dagligvare` · `Mat ute` · `Hjem` · `Underholdning` · `Gaming` · `Abonnement` · `Netthandel` · `Helse` · `Kosmetikk` · `Klær` · `Kreditt` · `Transport` · `Bil` · `Bolig` · `Boutgifter` · `Forsikring` · `Overføring` · `Inntekt` · `Sparing` · `Diverse` · `Annet`

Transactions that don't match any keyword fall back to `Annet`. Transaction types are exported the same way as `TRANSACTION_TYPES` / `TransactionType`, and supported banks as `BANKS` / `Bank`.

## Supported banks

| Bank  | Format              | Encoding     |
| ----- | ------------------- | ------------ |
| DNB   | CSV (`;` delimited) | UTF-8        |
| Valle | CSV (`;` delimited) | Windows-1252 |

A standalone `decodeWindows1252(buffer)` helper is also exported.

## Development

```bash
pnpm test       # run tests
pnpm typecheck  # type-check src + tests
pnpm build      # emit dist/
```

> The tests and the documentation were drafted with the help of an LLM (Claude)
