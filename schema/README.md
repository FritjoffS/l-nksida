# Schemahantering - Dokumentation

En komplett webbapplikation för hantering av personalschema och arbetstider, integrerad i l-nksida-ramverket.

## Översikt

Schemahanteringsappen är ett modernt verktyg för att:
- Stämpla in och ut arbetstid
- Visa personligt schema
- Generera tidsrapporter
- Administrera personal och schema (för administratörer)

## Funktioner

### För Personal

#### 📊 Översikt
- Se vem som är på plats just nu
- Visa mina arbetade timmar denna vecka
- Se nästa schemalagda arbetspass
- Snabbknappar för in/utstämpling

#### ⏰ Tidrapportering
- Stämpla in/ut med tidsstämpel
- Se historik över egna registreringar
- Filtrera per dag, vecka eller månad
- Lägga till kommentarer vid registrering

#### 📅 Schema
- Visa veckoschema
- Navigera mellan veckor
- Se alla medarbetares schema
- Färgkodade skift (morgon, dag, kväll)

#### 📈 Rapporter
- Generera personliga tidsrapporter
- Visa arbetade timmar per period
- Exportfunktion (kommande)

### För Administratörer

#### 👥 Personalhantering
- Lägg till ny personal
- Redigera användaruppgifter
- Ta bort användare
- Tilldela roller (personal/admin)

#### 📅 Schemaläggning
- Skapa veckoscheman
- Välj skifttyp per dag (morgon/dag/kväll/ledig)
- Ange arbetstider
- Kopiera schema från föregående vecka
- Schemalägg individuellt per person

#### ✅ Tidgodkännande
- Granska tidrapporter
- Se alla personalens arbetstid
- Filtrera per period

#### ⚙️ Inställningar
- Ställ in standardarbetstider
- Konfigurera raster
- Ange redigeringsperiod

## Teknisk Information

### Filstruktur
```
schema/
├── schema.html          # Huvudgränssnitt för personal
├── schema.css           # Stilmallar
├── schema.js            # Huvudlogik
├── admin.html           # Administrationsgränssnitt
├── admin.js             # Administrationslogik
└── README.md           # Denna fil
```

### Databasstruktur (Firebase)

```
schema/
├── users/
│   └── [userId]/
│       ├── name: string
│       ├── email: string
│       ├── role: "staff" | "admin"
│       ├── employeeId: string (optional)
│       └── createdAt: timestamp
│
├── timeEntries/
│   └── [userId]/
│       └── [date]/          # Format: YYYY-MM-DD
│           └── [entryId]/
│               ├── type: "in" | "out"
│               ├── time: string (HH:MM)
│               ├── timestamp: ISO timestamp
│               ├── comment: string (optional)
│               └── userId: string
│
├── schedules/
│   └── [userId]/
│       └── [date]/          # Format: YYYY-MM-DD
│           ├── type: "morning" | "day" | "evening" | "off"
│           ├── startTime: string (HH:MM)
│           ├── endTime: string (HH:MM)
│           └── updatedAt: timestamp
│
└── settings/
    ├── defaultStartTime: string
    ├── defaultEndTime: string
    ├── defaultBreak: number (minutes)
    └── editDays: number
```

## Installation

1. Kopiera alla filer till mappen `schema/` i l-nksida-projektet

2. **Konfigurera Firebase Realtime Database Security Rules:**

   a. Gå till Firebase Console: https://console.firebase.google.com
   
   b. Välj ditt projekt (l-nksida)
   
   c. Gå till "Realtime Database" i vänstermenyn
   
   d. Klicka på fliken "Rules"
   
   e. Ersätt befintliga regler med innehållet från `firebase-rules.json`, eller lägg till följande:

   ```json
   {
     "rules": {
       "schema": {
         "users": {
           "$uid": {
             ".read": "auth != null",
             ".write": "auth != null && (auth.uid === $uid || root.child('schema/users/' + auth.uid + '/role').val() === 'admin')"
           }
         },
         "timeEntries": {
           "$uid": {
             ".read": "auth != null && (auth.uid === $uid || root.child('schema/users/' + auth.uid + '/role').val() === 'admin')",
             ".write": "auth != null && (auth.uid === $uid || root.child('schema/users/' + auth.uid + '/role').val() === 'admin')"
           }
         },
         "schedules": {
           "$uid": {
             ".read": "auth != null",
             ".write": "auth != null && root.child('schema/users/' + auth.uid + '/role').val() === 'admin'"
           }
         },
         "settings": {
           ".read": "auth != null",
           ".write": "auth != null && root.child('schema/users/' + auth.uid + '/role').val() === 'admin'"
         }
       }
     }
   }
   ```
   
   f. Klicka på "Publish" för att spara reglerna

3. Säkerställ att Firebase är korrekt konfigurerat i `schema.js` och `admin.js`

4. Lägg till länk till schemaappen i navigationsbaren (`navbar/navbar.html`):
```html
<li role="none">
    <a href="../schema/schema.html" role="menuitem" aria-label="Gå till Schemahantering">
        <img src="../icons/icon_schema.png" alt="Schema">
        <br>Schemahantering
    </a>
</li>
```

## Användning

### Första Användaren (Admin)
1. Logga in med ditt Firebase-konto
2. En användarprofil skapas automatiskt med roll "staff"
3. Ändra manuellt rollen till "admin" i Firebase Console:
   - Gå till Realtime Database
   - Navigera till `schema/users/[ditt-userId]/role`
   - Ändra värdet till "admin"
4. Ladda om sidan - nu visas Admin-knappen

### För Personal
1. Logga in via inloggningssidan
2. Klicka på "Schemahantering" i menyn
3. Använd flikarna för att:
   - Se översikt
   - Stämpla in/ut
   - Visa schema
   - Generera rapporter

### För Administratörer
1. Klicka på "⚙️ Admin" i sidhuvudet
2. Använd flikarna för att:
   - Hantera personal
   - Schemalägga arbetsveckor
   - Granska tidrapporter
   - Konfigurera inställningar

## UI-Design

### Färgschema
- **Primär**: Blå (#007bff) - Navigation och primära knappar
- **Framgång**: Grön (#28a745) - Instämpling, aktiva statusar
- **Varning**: Gul (#ffc107) - Varningar
- **Fara**: Röd (#dc3545) - Utstämpling, ta bort-knappar
- **Gradient**: Lila/Rosa - Stats-kort och dekorativa element

### Responsiv Design
- Desktop: Full layout med grid
- Tablet: Anpassad grid-layout
- Mobil: Enkolumnslayout, stackade element

## Framtida Förbättringar

### Planerade Funktioner
- [ ] Excel-export av rapporter
- [ ] Push-notiser för schemaändringar
- [ ] Byte av arbetspass mellan anställda
- [ ] Automatisk beräkning av övertid
- [ ] Integration med lönesystem
- [ ] Frånvarohantering (sjukdom, semester)
- [ ] Grafisk statistikvy
- [ ] Mobil app (PWA)

### Tekniska Förbättringar
- [ ] Offline-stöd med Service Worker
- [ ] Optimerad caching
- [ ] Batch-operationer för bättre prestanda
- [ ] Automatisk backup av data
- [ ] Audit log för ändringar

## Säkerhet

### Autentisering
- Kräver Firebase Authentication
- Roll-baserad åtkomstkontroll
- Admin-funktioner skyddade

### Best Practices
- Validering på både klient och server
- Säker datahantering
- HTTPS-kryptering via Firebase

## Support & Felsökning

### Vanliga Problem

**Problem: "Permission denied" fel**
- **Orsak**: Firebase security rules är inte konfigurerade
- **Lösning**: 
  1. Gå till Firebase Console → Realtime Database → Rules
  2. Kopiera reglerna från `firebase-rules.json`
  3. Klicka "Publish"
  4. Ladda om sidan

**Problem: Admin-knappen visas inte**
- **Lösning**: Kontrollera att användarens roll är "admin" i databasen
  1. Gå till Firebase Console → Realtime Database
  2. Navigera till `schema/users/[ditt-userId]/role`
  3. Ändra värdet till "admin"

**Problem: Kan inte stämpla ut**
- **Lösning**: Säkerställ att du är instämplad först

**Problem: Schema visas inte**
- **Lösning**: Kontrollera att schema är skapat av admin för aktuell vecka

### Kontakt
Fredrik Söderberg - fredrik.soderberg@sjh.se

## Licens
Detta är en intern applikation för Sollebrunns Järnhandel.

## Versionshistorik

### Version 1.0.0 (2026-01-13)
- Första release
- Grundläggande tidrapportering
- Schemavisning
- Adminpanel
- Rapportgenerering
