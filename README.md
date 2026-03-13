# txcategorizer

Parse and categorize Norwegian bank transaction exports (limited support for DNB and Valle) into structured, labeled data.

## Install

```bash
pnpm add txcategorizer
```

## Basic usage

```ts
import { processTransactions } from 'txcategorizer';

const result = processTransactions(csvContent, 'dnb');
```

`csvContent` can be a `string` or `ArrayBuffer`. Valle exports use Windows-1252 encoding — pass the raw `ArrayBuffer` and the library handles decoding automatically.

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
    counterparty?: string; // "Sofie Krukhaug" (for transfers/Vipps)
    category: Category; // "Dagligvare"
    type: TransactionType; // "Varekjøp"
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
| `merchantAliases`        | `Record<string, string>`              | Normalize raw merchant names. Keys are lowercase prefix matches.                               |
| `categoryKeywords`       | `Partial<Record<Category, string[]>>` | Keywords (word-boundary matched) mapped to categories.                                         |
| `ownAccounts`            | `string[]`                            | Account numbers that identify transfers to your own accounts → type becomes `Kontoregulering`. |
| `cityPrefixes`           | `string[]`                            | City names that prefix merchant names in card transactions (e.g. `"Gjøvik Specsave"`).         |
| `nWordMerchants`         | `Record<string, number>`              | Multi-word merchant names. Key = first word, value = total word count to capture.              |
| `corporateSuffixPattern` | `RegExp`                              | Pattern to strip from company names (e.g. `" As"`, `" Asa"`).                                  |
| `extractionRules`        | `MerchantRule[]`                      | Fully replace the built-in extraction rules with your own.                                     |
| `debug`                  | `boolean`                             | Adds `raw` field with original description to each transaction.                                |

### Extending defaults

To add entries on top of the defaults rather than replacing them:

```ts
import { processTransactions, defaultCityPrefixes, defaultNWordMerchants } from 'txcategorizer';

const result = processTransactions(csvContent, 'dnb', {
    cityPrefixes: [...defaultCityPrefixes, 'Hamar', 'Lillehammer'],
    nWordMerchants: { ...defaultNWordMerchants, Little: 2 },
});
```

## Custom extraction rules

For full control over merchant extraction, provide your own `extractionRules`. Each rule has a `match` predicate and an `extract` function:

```ts
import { processTransactions, MerchantRule } from 'txcategorizer';

const myRules: MerchantRule[] = [
    {
        match: ({ type }) => type === 'Varekjøp',
        extract: ({ description }) => ({
            merchant: description.split(/\s+/)[0],
        }),
    },
];

const result = processTransactions(csvContent, 'dnb', {
    extractionRules: myRules,
});
```

## Categories

```ts
import { CATEGORIES } from 'txcategorizer';
```

The 20 built-in categories:

`Dagligvare` · `Mat ute` · `Hjem` · `Underholdning` · `Gaming` · `Abonnement` · `Netthandel` · `Helse` · `Kosmetikk` · `Kreditt` · `Transport` · `Bil` · `Bolig` · `Boutgifter` · `Forsikring` · `Overføring` · `Inntekt` · `Sparing` · `Diverse` · `Annet`

Transactions that don't match any keyword fall back to `Annet`.

## Valle encoding

Valle exports CSV files in Windows-1252. Pass the raw buffer and the library handles it:

```ts
import { decodeWindows1252 } from 'txcategorizer';

// Or let processTransactions handle it automatically:
const buffer = readFileSync('valle.csv').buffer;
processTransactions(buffer, 'valle'); // decoded internally
```

## Supported banks

| Bank  | Format              | Encoding     |
| ----- | ------------------- | ------------ |
| DNB   | CSV (`;` delimited) | UTF-8        |
| Valle | CSV (`;` delimited) | Windows-1252 |

# This documentation was drafted using an LLM (Claude)
