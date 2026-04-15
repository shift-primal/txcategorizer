export const CATEGORIES = [
    'Dagligvare',
    'Mat ute',
    'Hjem',
    'Underholdning',
    'Gaming',
    'Abonnement',
    'Netthandel',
    'Helse',
    'Kosmetikk',
    'Klær',
    'Kreditt',
    'Transport',
    'Bil',
    'Bolig',
    'Boutgifter',
    'Forsikring',
    'Overføring',
    'Inntekt',
    'Sparing',
    'Diverse',
    'Annet'
] as const;

export type Category = (typeof CATEGORIES)[number];
