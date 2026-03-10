import { extractMerchants } from '@/extract/extractEngine.ts';
import { categorizeTransactions } from '@/categorize/categorizeEngine.ts';
import { parseFullFile } from '@/parse/csv.ts';
import { Bank } from '@/types.ts';

const filePath = 'src/testdata/valle.csv';

async function run(filePath: string, bank: Bank) {
    const txs = categorizeTransactions(extractMerchants(await parseFullFile(filePath, bank)));
    console.log(JSON.stringify(txs, null, 2));
}

run(filePath, 'valle');
