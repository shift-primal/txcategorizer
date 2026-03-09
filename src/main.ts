import { extractMerchants } from './extract/engine.ts';
import { parseFullFile } from './parse/csv.ts';

// const parsed = testStrings1.map((t) => parseSingleLine(t));
// const extractedMerchants = extractMerchants(parsed);
// console.log('Parsed lines: ', parsed);
// console.log('Extracted merchants: ', extractedMerchants);

const filePath = './testdata/valle.csv';

const txs = await parseFullFile(filePath, 'valle');
const extracted = extractMerchants(txs);
console.log(extracted.slice(100, 200));
