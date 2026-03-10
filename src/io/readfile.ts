import { Bank } from '@/types.ts';

export async function denoReadFile(filePath: string, bank: Bank): Promise<string> {
    if (bank === 'valle') {
        const bytes = await Deno.readFile(filePath);
        return new TextDecoder('windows-1252').decode(bytes);
    }
    return Deno.readTextFile(filePath);
}
