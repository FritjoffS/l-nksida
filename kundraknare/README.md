# Kundräknare 📊

En webbapplikation för att spåra och analysera kundflöde i butiken. Appen samlar in och presenterar statistik om antal kunder som besöker butiken över tid.

## Översikt

Kundräknare är ett verktyg för att övervaka besöksstatistik i realtid och analysera historiska trender. Appen stödjer flera enheter som kan registrera kunder och sammanställer data från alla källor.

## Funktioner

### 📈 Statistikvisning
- **Sammanfattningskort**: Visar totalt antal kunder, antal dagar, genomsnitt per dag och senaste timmen
- **Daglig statistik**: Detaljerad tabell med antal kunder per dag, första/sista registrering och kunder per timme
- **Timstatistik**: Grafisk fördelning av kundflöde per timme (genomsnitt)
- **Enhetsstatistik**: Översikt över registreringar från varje enhet
- **Detaljerad logg**: Full logg över alla registreringar med tidsstämpel och enhet

### 📅 Tidsperioder
- **Idag (Live)**: Realtidsuppdateringar av dagens statistik
- **Denna vecka**: Statistik för de senaste 7 dagarna
- **Denna månad**: Statistik för de senaste 30 dagarna
- **Anpassad period**: Välj valfri start- och slutdatum

### 🔧 Enhetshantering
- Automatisk upptäckt av nya enheter som registrerar data
- Namnge enheter för enkel identifiering
- Aktivera/inaktivera specifika enheter
- Visa när enheter först och senast användes
- Filtrera statistik per enhet

### 🎯 Filtrering
- Visa data från alla enheter eller filtrera på specifik enhet
- Live-uppdateringar stoppas automatiskt vid historisk datavisning

## Teknisk information

### Dependencies
- **Firebase Realtime Database**: För datalagring och realtidsuppdateringar
- **CSS-filer**:
  - `global.css`: Globala stilar
  - `navbar.css`: Navigationsstil
  - `kundraknare.css`: Appspecifika stilar

### Datastruktur

#### Firebase-struktur
```
customers/
  └── {year}/
      └── {month}/
          └── {day}/
              └── {entryId}
                  ├── timestamp
                  ├── device_id
                  ├── device_name
                  └── mac_address

devices/
  └── {device_id}
      ├── device_id
      ├── name
      ├── mac_address
      ├── first_seen
      ├── last_seen
      └── active
```

### Viktiga funktioner

#### Live-uppdateringar
```javascript
setupLiveUpdates()  // Startar realtidslyssning för dagens data
stopLiveUpdates()   // Stoppar live-läge
```

#### Datahämtning
```javascript
fetchCustomerData(startDate, endDate)  // Hämtar data för vald period
filterDataByDevice(data, deviceId)     // Filtrerar data per enhet
```

#### Enhetshantering
```javascript
loadDevices()                          // Laddar alla registrerade enheter
detectAndRegisterDevice(entry)         // Automatisk enhetsregistrering
saveDeviceName(deviceId)               // Sparar enhetsnamn
toggleDeviceActive(deviceId, active)   // Aktiverar/inaktiverar enhet
```

## Användning

### Grundläggande användning
1. Öppna `kundraknare.html` i webbläsaren
2. Välj önskad tidsperiod (standardinställning är dagens datum)
3. Klicka på "Hämta data" eller välj en snabbperiod (Idag, Denna vecka, Denna månad)
4. Statistiken visas i sammanfattningskort, tabeller och diagram

### Live-läge
1. Klicka på "Idag (Live)" för att aktivera realtidsuppdateringar
2. Statistiken uppdateras automatiskt när ny data registreras
3. Live-läget stoppas automatiskt när annan period väljs

### Enhetshantering
1. Klicka på "⚙️ Hantera enheter"
2. Se lista över alla registrerade enheter
3. Ange namn för enheter i textfältet
4. Klicka "💾 Spara namn" för att spara
5. Aktivera/inaktivera enheter med respektive knapp

### Filtrera per enhet
1. Använd rullgardinsmenyn "Filtrera enhet"
2. Välj "Alla enheter" eller en specifik enhet
3. Statistiken uppdateras automatiskt

### Detaljerad logg
1. Markera "Visa detaljerad logg"
2. En fullständig logg med alla registreringar visas längst ner

## Filstruktur

```
kundraknare/
├── README.md             # Denna fil
├── kundraknare.html      # Huvudsida
├── kundraknare.js        # Applikationslogik
├── kundraknare.css       # Stilmallar
└── todo.md              # Planerade funktioner
```

## Planerade förbättringar

Se [todo.md](todo.md) för lista över planerade uppdateringar och förbättringar.

## Support

För frågor eller problem, kontakta systemadministratören.

## Version

Senast uppdaterad: 2026-03-24
