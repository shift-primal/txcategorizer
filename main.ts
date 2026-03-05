import { parseLine } from './csv.ts';
import { testStrings } from './testTxs.ts';

if (import.meta.main) {
    const parsed = testStrings.map((t) => parseLine(t));
    console.log(parsed);
}
