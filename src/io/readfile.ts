import { Bank } from '@/parse/csv.ts';

export async function readFile(filePath: string, bank: Bank): Promise<string> {
    if (bank === 'valle') {
        const bytes = await Deno.readFile(filePath);
        return new TextDecoder('windows-1252').decode(bytes);
    }
    return Deno.readTextFile(filePath);
}
