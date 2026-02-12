# Dynamisk Link-App

Ett system där **en enda HTML-template** laddar innehåll dynamiskt från Firebase baserat på URL-parameter.

## Hur det fungerar

Istället för separata HTML-filer för varje avdelning, används en gemensam template:

| Gammal URL | Ny URL |
|------------|--------|
| `/kontor/kontor.html` | `/links/?app=kontor` |
| `/butik/butik.html` | `/links/?app=butik` |
| `/verkstad/verkstad.html` | `/links/?app=verkstad` |

## Firebase-struktur

### App-konfiguration
Lägg till konfiguration under `link-apps-config/`:

```
link-apps-config/
├── kontor/
│   ├── title: "Kontor"
│   ├── emptyIcon: "🏢"
│   └── description: "kontorslänkar"
├── butik/
│   ├── title: "Butik"
│   ├── emptyIcon: "🛒"
│   └── description: "butikslänkar"
└── verkstad/
    ├── title: "Verkstad"
    ├── emptyIcon: "🔧"
    └── description: "verkstadslänkar"
```

### Länkdata
Länkarna lagras under `link-apps-data/`:

```
link-apps-data/
├── kontor/
│   └── Fortnox/
│       ├── url: "https://fortnox.se"
│       └── imageUrl: "https://..."
├── butik/
│   └── Kassan/
│       └── url: "https://..."
└── verkstad/
    └── ...
```

**OBS:** Den nya strukturen gör att nya appar fungerar automatiskt utan att behöva uppdatera Firebase-regler.

## Lägga till en ny app

### Via Admin-sidan (rekommenderat)
1. Gå till `/links/admin.html`
2. Klicka på "Lägg till ny app"
3. Fyll i:
   - **App-ID**: t.ex. `lager` (används i URL)
   - **Visningsnamn**: t.ex. `Lager`
   - **Beskrivning**: t.ex. `lagerlänkar`
   - **Emoji-ikon**: Välj från listan eller skriv egen
4. Klicka "Spara"
5. Klart! Appen är nu tillgänglig på `/links/?app=lager`

### Manuellt i Firebase
1. **Lägg till i Firebase** under `link-apps-config/`:
   ```json
   {
     "title": "Lager",
     "emptyIcon": "📦",
     "description": "lagerlänkar"
   }
   ```

2. **Klart!** Appen är nu tillgänglig på `/links/?app=lager`

## Fördelar

- ✅ **En fil att underhålla** - All HTML på ett ställe
- ✅ **Dynamiska appar** - Lägg till nya via Firebase utan koddeploy
- ✅ **Konsekvent design** - Garanterat samma utseende överallt
- ✅ **Enklare uppdateringar** - Fixa buggar på ett ställe

## Uppdatera navbar

För att länka till dynamiska appar i navigeringen, använd:

```html
<a href="../links/?app=kontor">Kontor</a>
<a href="../links/?app=butik">Butik</a>
<a href="../links/?app=verkstad">Verkstad</a>
```

## Felhantering

Om `?app=` parametern saknas eller appen inte finns i Firebase visas ett felmeddelande med länk tillbaka till startsidan.

## Administration

Använd admin-sidan för att hantera link-appar utan att behöva redigera Firebase manuellt:

**URL:** `/links/admin.html`

Funktioner:
- ✅ Visa alla konfigurerade appar
- ✅ Lägg till nya appar
- ✅ Redigera befintliga appar
- ✅ Radera appar
- ✅ Snabblänk för att öppna varje app

## Migration från gammal struktur

Om du har befintlig data i t.ex. `kontor/`, `butik/`, `verkstad/` på root-nivå behöver du flytta den till `link-apps-data/`:

1. I Firebase Console, kopiera data från t.ex. `kontor/` till `link-apps-data/kontor/`
2. Eller använd Firebase CLI:
   ```bash
   # Exportera -> manuellt flytta -> importera
   firebase database:get /kontor > kontor-backup.json
   # Importera till ny plats
   firebase database:set /link-apps-data/kontor kontor-backup.json
   ```
