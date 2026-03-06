import { Bank } from '@/parse/csv.ts';

export const testStrings: { tx: string; bank: Bank }[] = [
    {
        tx: '"08.11.2025";"Overføring Innland  992 Per Arne Gluppestad Betaling Tpp: Vipps Mobilepay AS";"05.10.2025";55;""',
        bank: 'dnb',
    },
    {
        tx: '"28.10.2025";"Overføring  5511290428 Daniel Hagen Monster Tpp: Vipps Mobilepay AS";"28.10.2024";350;""',
        bank: 'dnb',
    },
    {
        tx: '"29.10.2025";"Visa  100021  Vipps:klarna ";"30.10.2025";1198.5;""',
        bank: 'dnb',
    },
    {
        tx: '"27.09.2025";"Varekjøp Extra Tveita Se Tvetenveien Oslo Dato 27.09 kl. 16.49 ";"29.09.2025";82.7;""',
        bank: 'dnb',
    },
    {
        tx: '"14.08.2025";"E-varekjøp Kiwi 012 Raufos Raufoss Dato 14.08 kl. 19.27 ";"15.08.2025";117.7;""',
        bank: 'dnb',
    },
    {
        tx: '"16.07.2025";"Visa  100422  Eur 7,64 Konzum P-0633 Valutakurs: 12,1518";"17.07.2025";92.84;""',
        bank: 'dnb',
    },
    {
        tx: '"12.02.2026";"Varekjøp i butikk IKEA RINGSAKER        F Reservert transaksjon ";"13.02.2026";1105;""',
        bank: 'dnb',
    },
    {
        tx: '"06.03.2025";"Varekjøp Mdc 048 Gjøvik Elvegata 6 Gjøvik Dato 06.03 kl. 21.37 ";"07.03.2025";85;""',
        bank: 'dnb',
    },
    {
        tx: '05.01.2026;05.01.2026;05.01.2026;LYKO.COM/NO;Varekjøp;Varekjøp debetkort;2450 41 52085;Marte Haugen Gjellerud;;;;-1150;NOK;Bokført;*9711 03.01 NOK 1150.00 LYKO.COM/NO Kurs: 1.0000;;;;;;',
        bank: 'valle',
    },
    {
        tx: '22.12.2025;22.12.2025;22.12.2025;Vipps*Uno-X;Varekjøp;Varekjøp debetkort;2810 15 86319;Sofie Krukhaug Linde;;;;-550;NOK;Bokført;*3891 19.12 NOK 550.00 Vipps*Uno-X Kurs: 1.0000;;;;;;',
        bank: 'valle',
    },
    {
        tx: '10.02.2026;10.02.2026;10.02.2026;09.02 KIWI 012 RAUFOS STORGATA 68  RAUFOSS;Varekjøp;Varekjøp debetkort;5988 23 87234;Joakim Nordmann;;;;-662.2;NOK;Bokført;09.02 KIWI 012 RAUFOS STORGATA 68  RAUFOSS;;;;;;',
        bank: 'valle',
    },
    {
        tx: '12.01.2026;12.01.2026;12.01.2026;274000 EXTRA RAUFOSS;Varekjøp;Varekjøp debetkort;4830 49 88590;Sofie Krukhaug Linde;;;;-53.8;NOK;Bokført;*0117 10.01 NOK 53.80 274000 EXTRA RAUFOSS Kurs: 1.0000;;;;;;',
        bank: 'valle',
    },
    {
        tx: '11.02.2026;11.02.2026;12.02.2026;APPLE.COM/BILL;Varekjøp;Varekjøp i utlandet;1414 95 56290;Sofie Krukhaug Linde;;;;-79;NOK;Bokført;*8851 10.02 NOK 79.00 APPLE.COM/BILL Kurs: 1.0000;;;;;;',
        bank: 'valle',
    },
    {
        tx: '08.01.2026;08.01.2026;08.01.2026;VERISURE AS (17105829310);Betaling innland;Betaling med KID innland;7781 90 01982;Brukskonto 15 - 31;8271 51 20391;VERISURE AS;;-539;NOK;Bokført;Til: VERISURE AS Betalt: 08.01.26;;;;;;',
        bank: 'valle',
    },
    {
        tx: '31.01.2026;31.01.2026;30.01.2026;Lønn fra REMA 1000;Lønn;Lønn;6173 05 49910;;7180 09 87143;Sofie Krukhaug Linde;43212.67;;NOK;Bokført;Lønn fra REMA 1000;;;;;;',
        bank: 'valle',
    },
];
