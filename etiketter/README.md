# Etikettskrivare

En webbaserad app för att skapa och skriva ut etiketter för produkter i sortimentet.

## Specifikationer

- **Etikettstorlek**: 81 mm × 23 mm (liggande format)
- **Format**: HTML5 med responsiv design
- **Webbläsare**: Fungerar i alla moderna webbläsare (Chrome, Firefox, Safari, Edge)

## Funktioner

### Grundläggande
- ✅ Mata in produktinformation
- ✅ Förhandsvisning av etikett i realtid
- ✅ Skriv ut etikett direkt
- ✅ Spara data automatiskt (localStorage)
- ✅ Rensa formulär

### Produktinformation
Etiketten kan innehålla följande information:

1. **Benämning** - Produktens namn
2. **Leverantör** - Leverantörens namn
3. **Produktnummer** - Produktnummer i vårt system
4. **Artikelnummer** - Leverantörens artikelnummer
5. **Hyllplats** - Var produkten är lagrad
6. **Beställningspunkt/Beställningskvantitet** - Beställningsinfo

## Användning

### Öppna appen
Öppna `etiketter.html` i en webbläsare.

### Fylla i information
1. Skriv in den information du vill ha på etiketten
2. Klicka "Visa förhandsvisning" för att se hur etiketten ser ut
3. Data sparas automatiskt

### Skriva ut
1. Klicka "Skriv ut etikett"
2. Kontrollera förhandsvisningen i utskriftsdialogen
3. Säkerställ att etikettstorleken är 81 × 23 mm
4. Skriv ut på etikettskrivaren

### Tips för utskrift
- **Pappersstorlek**: Använd rätt etikettstorlek (81 × 23 mm) i skrivaren
- **Marginaler**: Ställ in marginaler på 0 mm för optimal användning
- **Färgkvalitet**: Se till att skrivaren är inställd på rätt kvalitet
- **Testutskrift**: Gör en testutskrift på vanligt papper först

## Filer

- `etiketter.html` - HTML-struktur och form
- `etiketter.css` - Styling och layout
- `etiketter.js` - Funktionalitet och logik
- `README.md` - Denna dokumentation

## Teknologi

- **HTML5** - Struktur
- **CSS3** - Layout och styling (responsive design)
- **JavaScript (ES6)** - Interaktivitet
- **localStorage API** - Datasparing

## Bekanta fel och lösningar

### Etiketten ser fel ut vid utskrift
- Kontrollera att du använder rätt pappersstorlek (81 × 23 mm)
- Se till att marginaler är inställda på 0 mm
- Prova att justera skalningen i utskriftsinställningarna

### Data försvinner när jag stänger appen
- Data sparas i webbläsarens localStorage
- Om du rensar webbläsarens cache/cookies försvinner sparad data
- Försök att inte rensa cache eller använd privat browsning om du vill behålla data

### Text är för liten/stor på etiketten
- Du kan justera fontstorlek i CSS-filen (`etiketter.css`)
- Uppdatera värdet för `font-size` i klassen `.etikett-content`

## Framtida förbättringar

Möjliga utökningar:
- Import av produktdata från CSV-fil
- Stöd för streckkoder/QR-koder
- Mallar för olika etikettstorlekar
- Barcod-generering automatiskt från artikelnummer
- Batch-utskrift av flera etiketter
- Export av etikettmall

## Support

För frågor eller problem, kontakta ansvarig för IT-systemen.
