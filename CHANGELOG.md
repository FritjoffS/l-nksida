# Changelog - Sollebrunns Järnhandel PWA

Alla viktiga ändringar i detta projekt dokumenteras i denna fil.

## [2.2.0] 26-02-10

### Nya funktionaliteter i Guider

## Nya funktioner

# Adminsidan borttagen
# Redigera / skapa guider i visningsläget

## [2.1.6] - 26-02-10

# En gemensam JavaScript-modul (scripts/link-app.js) med all logik
# En gemensam CSS-fil (styles/link-app.css)
# Minimala sidor som bara konfigurerar namn och databasreferens

## [2.1.5] - 26-02-10

### Arbetsbeskrivningar-appen har nu samma intuitiva funktionalitet som aviseringar-appen:

## Nya funktioner:

# Loading overlay med spinner vid laddning
# Toast-notifikationer för feedback (kopierat, sparat, raderat, fel)
# Action bar med "Lägg till arbetsbeskrivning"-knapp
# Modal för att lägga till/redigera/radera arbetsbeskrivningar
# Redigeringsknapp (✏️) som visas vid hover på varje knapp
# Empty state när inga arbetsbeskrivningar finns
# Modern stil med grön gradient på knapparna och animationer
# Tangentbordsnavigering (Escape stänger modalen)
# Alfabetisk sortering av arbetsbeskrivningar
# PWA-stöd med Service Worker-registrering
# Responsiv design för mobila enheter

## [2.1.4] - 26-02-10

### Aviseringar-appen har nu samma intuitiva funktionalitet som kontor-appen:

## Nya funktioner:

# Loading overlay med spinner vid laddning
# Toast-notifikationer för feedback (kopierat, sparat, raderat, fel)
# Action bar med "Lägg till avisering"-knapp
# Modal för att lägga till/redigera/radera aviseringar
# Redigeringsknapp (✏️) som visas vid hover på varje knapp
# Empty state när inga aviseringar finns
# Modern stil med animationer och responsiv design
# Tangentbordsnavigering (Escape stänger modalen)
# Alfabetisk sortering av aviseringar
# PWA-stöd med Service Worker-registrering

## [2.1.3] Ändrat caching-strategi för CSS/JS till "Network First"

## [2.1.1] - 25-10-28

### Test av update-version.bat

## [2.1.0] - 2025-08-20

### Anpassat utseende för mobila enheter
 - Navbar anpassad
 - time_date.css anpassd
 - search.css anpassad

## [2.0.0] - 2025-08-20

### Tillagt
- PWA-funktionalitet med installbar app
- Husqvarna Service Hub genväg i verkstad
- Manifest.json för app-metadata
- Service Worker för offline-funktionalitet
- App-ikoner och tema-färger

### Ändrat
- Uppdaterade HTML-filer med PWA Meta Tags
- Förbättrad mobilanpassning

### Borttaget
- PWA Meta Tags från login- och admin-sidor

---

## [1.0.0] - 2025-XX-XX

### Tillagt
- Grundläggande länksida struktur
- Firebase-integration
- Mobilinventeringsapp med streckkodsskanning
- Verkstad-sektion med dynamiska knappar
- Användarautentisering

---

## Format
- **[Tillagt]** för nya funktioner
- **[Ändrat]** för ändringar i befintlig funktionalitet  
- **[Borttaget]** för borttagna funktioner
- **[Fixat]** för buggfixar
- **[Säkerhet]** för säkerhetsuppdateringar
