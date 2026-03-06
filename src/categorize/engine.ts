import { RawTransaction } from '../parse/csv.ts';
import { CategoryRule } from './rules.ts';

const CATEGORIES = [
    'Dagligvare',
    'Mat ute',
    'Hjem',
    'Underholdning',
    'Gaming',
    'Abonnement',
    'Netthandel',
    'Helse',
    'Kosmetikk',
    'Kreditt',
    'Transport',
    'Bil',
    'Bolig',
    'Boutgifter',
    'Forsikring',
    'Overføring',
    'Inntekt',
    'Annet',
] as const;

export type Category = (typeof CATEGORIES)[number];

function categorize(tx: RawTransaction, rules: CategoryRule[]) {}
