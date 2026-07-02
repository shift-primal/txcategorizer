/** "burger KING gjøvik" → "Burger King Gjøvik" */
export const titleCase = (value: string): string =>
    value.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
