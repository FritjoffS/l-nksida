# Migration till Firebase Realtime Database

## Översikt
Denna migration flyttar produktdatabasen från lokala JavaScript-filer till Firebase Realtime Database för bättre prestanda, realtidsuppdateringar och centraliserad datahantering.

## Vad som har ändrats

### 1. Firebase-konfiguration
- **Fil**: `scripts/firebase-config.js`
- **Ändring**: Centraliserad Firebase-konfiguration med ES modules (Firebase SDK 10.x)

### 2. Produktsida
- **Fil**: `products/products.html`
- **Ändringar**:
  - Lagt till Firebase Database SDK
  - Ersatt lokal import med Firebase-hämtning
  - Lagt till laddningsindikator
  - Asynkron datahämtning efter autentisering

### 3. Nya filer

#### `products/migrate-to-firebase.html`
Migreringsverktyg för att flytta data från lokala filer till Firebase:
- Testar Firebase-anslutning
- Migrerar all produktdata automatiskt
- Visar migreringsframsteg
- Kan rensa databasen vid behov

#### `products/admin.html`
Komplett adminpanel för produkthantering:
- Databasöversikt med statistik
- Lägg till/redigera produkter
- Ta bort produkter
- Lista produkter per kategori
- Validering och felhantering

#### `products/backup-restore.html`
Backup och återställningsverktyg:
- Skapa backup av hela databasen
- Ladda ner backup som JSON-fil
- Återställ från backup-fil
- Export/import via JSON

## Migrationsprocess

### Steg 1: Förberedelse
1. Se till att Firebase-projektet är korrekt konfigurerat
2. Kontrollera att användaren har rätt behörigheter
3. Skapa en backup av befintliga data (rekommenderas)

### Steg 2: Migrera data
1. Öppna `products/migrate-to-firebase.html`
2. Logga in med administratörskonto
3. Klicka "Testa Anslutning" för att verifiera Firebase-uppkopplingen
4. Klicka "Starta Migrering" för att överföra all data

### Steg 3: Verifiera migration
1. Kontrollera att data har migrerats korrekt via adminpanelen
2. Testa produktsökningen på `products/products.html`
3. Verifiera att alla kategorier och produkter visas korrekt

### Steg 4: Ta bort gamla filer (valfritt)
Efter lyckad migration kan följande filer tas bort:
- `products/productsDB.js`
- `products/db/` (hela mappen)

## Databasstruktur i Firebase

```
products/
├── "Briggs & Stratton"/
│   ├── name: "Briggs & Stratton"
│   ├── subgroups: [...]
│   └── products: [...]
├── "Stiga"/
│   ├── name: "Stiga"
│   ├── subgroups: [...]
│   └── products: [...]
└── ...
```

## Säkerhetsregler
Uppdatera Firebase Realtime Database rules för att säkerställa rätt åtkomst:

```json
{
  "rules": {
    "products": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## Fördelar med Firebase-migrationen

1. **Realtidsuppdateringar**: Ändringar syns omedelbart för alla användare
2. **Centraliserad data**: En datakälla för alla klienter
3. **Skalbarhet**: Hanterar större datamängder bättre
4. **Backup**: Automatiska backups via Firebase
5. **Administation**: Webbaserat admin-gränssnitt
6. **Säkerhet**: Firebase-autentisering och säkerhetsregler

## Felsökning

### Problem: "Permission denied"
- Kontrollera Firebase säkerhetsregler
- Se till att användaren är inloggad
- Verifiera användarens behörigheter

### Problem: Data laddas inte
- Kontrollera nätverksanslutning
- Verifiera Firebase-konfiguration
- Kolla konsolen för JavaScript-fel

### Problem: Migration misslyckas
- Kontrollera att alla lokala datafiler finns
- Se till att Firebase Database är aktiverat
- Verifiera att användaren har skrivbehörighet

## Backup-strategi

1. **Automatisk backup**: Firebase sköter grundläggande backups
2. **Manuell backup**: Använd `backup-restore.html` regelbundet
3. **Versionshantering**: Spara JSON-exports vid större ändringar

## Framtida utveckling

Med Firebase-databasen kan följande funktioner enkelt läggas till:
- Realtidsnotifikationer vid dataändringar
- Collaboration med flera administratörer
- Automatisk synkronisering mellan enheter
- Avancerad sökning och indexering
- API för externa system
