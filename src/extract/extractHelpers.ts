export const capFirstChar = (str: string) =>
    str.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
