# Link-App System

Ett modulärt system för att skapa länk-sidor med gemensam funktionalitet.

## Befintliga sidor

- **Kontor** (`/kontor/`) - Databas: `kontor`
- **Butik** (`/butik/`) - Databas: `butik`  
- **Verkstad** (`/verkstad/`) - Databas: `verkstad`

## Skapa en ny länk-sida

### Steg 1: Skapa mappen

Skapa en ny mapp i projektets rot, t.ex. `lager/`

### Steg 2: Skapa JavaScript-filen

Skapa `lager/lager.js` med följande innehåll:

```javascript
/**
 * [SIDNAMN] länk-app
 * Använder gemensam link-app modul
 */
import { initLinkApp } from '../scripts/link-app.js';

initLinkApp({
  dbPath: 'lager',        // Firebase database path (måste vara unikt)
  title: 'Lager',         // Visningsnamn
  emptyIcon: '📦'          // Emoji för empty state
});
```

### Steg 3: Skapa HTML-filen

Skapa `lager/lager.html` och använd mallen nedan. Ersätt:
- `[SIDNAMN]` med sidans namn (t.ex. "Lager")
- `[mappnamn]` med mappens namn (t.ex. "lager")
- `[beskrivning]` med kort beskrivning för aria-label (t.ex. "Lagerlänkar")

```html
<!DOCTYPE html>
<html lang="sv">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="author" content="Fredrik Söderberg" />
  <title>[SIDNAMN]</title>

  <!-- PWA Meta Tags -->
  <link rel="manifest" href="../manifest.json" />
  <meta name="theme-color" content="#ff6600" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Järnhandel" />
  <link rel="apple-touch-icon" href="../logo.png" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="application-name" content="Järnhandel" />
  <link rel="icon" type="image/png" sizes="192x192" href="../images/logo_rund.png" />
  <link rel="icon" type="image/png" sizes="512x512" href="../logo.png" />

  <link rel="stylesheet" href="../styles/global.css" />
  <link rel="stylesheet" href="../styles/navbar.css" />
  <link rel="stylesheet" href="../styles/link-app.css" />

  <!-- Google Analytics -->
  <script type="module" src="../scripts/analytics.js" async></script>
</head>

<body>
  <!-- Loading overlay -->
  <div id="loadingOverlay" role="alert" aria-live="polite">
    <div class="spinner"></div>
    <p>Laddar [beskrivning]...</p>
  </div>

  <div id="navbar" role="navigation" aria-label="Huvudnavigering"></div>

  <main role="main">
    <!-- Action bar -->
    <div class="action-bar">
      <button class="add-link-btn" id="addLinkBtn" title="Lägg till ny länk">
        ➕ <span>Lägg till länk</span>
      </button>
    </div>

    <div class="container" id="buttonContainer" role="list" aria-label="[beskrivning]">
      <!-- Dynamic buttons will be loaded here -->
    </div>
  </main>

  <!-- Add/Edit Link Modal -->
  <div class="modal" id="linkModal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="modalTitle">Lägg till länk</h2>
        <button class="close-btn" id="closeModalBtn" aria-label="Stäng">&times;</button>
      </div>
      <form id="linkForm">
        <div class="form-group">
          <label for="linkName">Benämning *</label>
          <input type="text" id="linkName" required placeholder="T.ex. Fortnox">
        </div>
        <div class="form-group">
          <label for="linkUrl">URL *</label>
          <input type="url" id="linkUrl" required placeholder="https://...">
        </div>
        <div class="form-group">
          <label for="linkImage">Bild-URL</label>
          <input type="text" id="linkImage" placeholder="https://... eller data:image/...  (valfritt)">
          <small class="form-hint">Lämna tomt för att visa benämningen som text</small>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="cancelBtn">Avbryt</button>
          <button type="button" class="btn btn-danger" id="deleteBtn" style="display: none;">Radera</button>
          <button type="submit" class="btn btn-success">Spara</button>
        </div>
      </form>
    </div>
  </div>

  <script type="module" src="[mappnamn].js"></script>
  <script src="../scripts/loadNavbar.js"></script>

  <!-- PWA Service Worker Registration -->
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('../sw.js')
          .then(function (registration) {
            console.log('[PWA] Service Worker registered:', registration.scope);

            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              console.log('[PWA] New Service Worker found');

              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] Update available');
                  if (confirm('En ny version är tillgänglig! Vill du uppdatera nu?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            });
          })
          .catch(function (err) {
            console.error('[PWA] Service Worker registration failed:', err);
          });

        // Reload page when new service worker takes control
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            console.log('[PWA] New Service Worker activated, reloading...');
            window.location.reload();
          }
        });
      });
    }
  </script>
</body>

</html>
```

### Steg 4: Lägg till i navbar (valfritt)

Om sidan ska visas i navigeringsmenyn, uppdatera `navbar/navbar.html`.

## Konfigurationsalternativ

| Option | Typ | Beskrivning |
|--------|-----|-------------|
| `dbPath` | string | **Obligatoriskt.** Sökväg i Firebase Realtime Database |
| `title` | string | Visningsnamn för sidan |
| `emptyIcon` | string | Emoji som visas när inga länkar finns |

## Vanliga emojis

- 🏢 Kontor
- 🛒 Butik
- 🔧 Verkstad
- 📦 Lager
- 🏭 Fabrik
- 🚚 Transport
- 📋 Administration
- 💼 Försäljning
- 🔩 Reservdelar

## Filstruktur

```
projekt/
├── scripts/
│   ├── link-app.js      # Gemensam logik (ändra inte!)
│   └── firebase-config.js
├── styles/
│   └── link-app.css     # Gemensam styling (ändra inte!)
├── kontor/
│   ├── kontor.html
│   └── kontor.js        # ~10 rader
├── butik/
│   ├── butik.html
│   └── butik.js         # ~10 rader
└── [ny-sida]/
    ├── [ny-sida].html
    └── [ny-sida].js     # ~10 rader
```

## Fördelar med detta system

1. **Ingen duplicerad kod** - All logik finns i `link-app.js`
2. **Enkel att underhålla** - Fixa buggar eller lägg till features på ett ställe
3. **Snabbt att skapa nya sidor** - ~10 rader JS + HTML-mall
4. **Konsekvent design** - Samma CSS för alla sidor
