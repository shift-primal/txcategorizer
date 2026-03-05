import { parse as csvParse } from '@std/csv';
import { Bank } from './types.ts';

const headers = {
    dnb: '"Dato";"Forklaring";"Rentedato";"Ut fra konto";"Inn på konto"',
    valle: 'Betalingstidspunkt;Bokført dato;Valuteringsdato;Skildring;Type;Undertype;Frå konto;Avsendar;Til konto;Mottakarnamn;Beløp inn;Beløp ut;Valuta;Status;Melding/KID/Fakt.nr;eFaktura;eFaktura eier;eFaktura type;Melding;KID;Faktura nr.',
};

export const parseLine = ({ tx, bank }: { tx: string; bank: Bank }) => {
    const result = csvParse(headers[bank] + '\n' + tx, {
        skipFirstRow: true,
        separator: ';',
    });
    return result[0];
};
