# Motion Sensor Dashboard

En webbapp för att visualisera data från Motion Sensor Logger, integrerad i l-nksida-projektet.

## 🚀 Snabbstart

1. **Öppna `motion.html` i webbläsaren**
   - Navigera via projektets huvudmeny, eller
   - Öppna direkt: `motion/motion.html`

2. **Logga in**
   - Appen kräver autentisering via Firebase Authentication
   - Används automatiskt samma inloggning som resten av projektet

3. **Konfigurera anslutning**
   - Ange Device ID (samma som i ESP8266-koden, standard: 0001)
   - Klicka "Spara konfiguration"

4. **Visa data**
   - Klicka "Ladda data"
   - Dashboarden visar statistik och sessioner automatiskt

## 📊 Funktioner

- ✅ **Integrerad autentisering** - Samma inloggning som resten av projektet
- ✅ **Gemensam navigation** - Navbar med tillgång till alla funktioner
- ✅ **Realtidsöversikt** - Status, dagens, veckans och total driftstid
- ✅ **Sessionslista** - Alla sessioner med start/stopp-tid och varaktighet
- ✅ **Filtrera data** - Idag, vecka, månad eller alla sessioner
- ✅ **Automatisk konfiguration** - Sparar inställningar i localStorage
- ✅ **Responsiv design** - Fungerar på mobil, tablet och desktop
- ✅ **PWA-stöd** - Kan installeras som app
- ✅ **Firebase-integration** - Använder projektets centrala Firebase-konfiguration

## 🔧 Teknisk information

### Filer

- `motion.html` - Huvudsida (integrerad med projektets struktur)
- `motion.js` - JavaScript-logik med Firebase-integration och autentisering
- `motion.css` - Specifika stilar för motion sensor dashboard
- `index.html` - Gammal fristående version (kan tas bort)

### Firebase-struktur

Data läses från följande struktur i Firebase Realtime Database:

```
motion/
  {deviceId}/
    status/
      device_online: boolean
      started_at: timestamp
    events/
      {year}/
        {month}/
          {day}/
            {sessionId}/
              timestamp_start: timestamp
              timestamp_stop: timestamp
              duration_ms: number
```

### Firebase Security Rules

För att webappen ska kunna läsa data:

```json
{
  "rules": {
    "motion": {
      "$deviceId": {
        ".read": "auth != null",
        ".write": true
      }
    }
  }
}
```

⚠️ Skrivrättigheter är öppna för ESP8266. Läsrättigheter kräver autentisering.

## 🌐 Publicera online

### GitHub Pages

1. Pusha projektet till GitHub
2. Gå till Settings → Pages
3. Välj main branch → `/webapp` folder
4. Spara - din dashboard är nu live!

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Välj webapp-mappen som public directory
firebase deploy
```

### Netlify (Dra och släpp)

1. Gå till [netlify.com](https://netlify.com)
2. Dra `webapp`-mappen till Netlify
3. Klar!

## 🛠️ Anpassningar

### Ändra färgtema

Redigera CSS-variablerna i `<style>`-sektionen:

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Lägg till fler statistikkort

Kopiera en `.stat-card` i HTML och uppdatera JavaScript för att beräkna ny data.

### Ändra datumformat

I `formatDate()`-funktionen kan du ändra `toLocaleDateString()` parametrar.

## 📱 Skärmdumpar

### Desktop-vy
- Fullständig dashboard med alla statistikkort
- Sessionslista med filtrering
- Status-indikator

### Mobil-vy
- Responsiv layout
- Touch-vänlig navigation
- Samma funktionalitet som desktop

## 🔒 Säkerhet

**Utveckling:**
- OK att använda publika läsregler för testning

**Produktion:**
- Implementera Firebase Authentication
- Begränsa läsåtkomst till autentiserade användare
- Använd miljövariabler för konfiguration

## 🐛 Felsökning

### "Ingen data hittades"
- Kontrollera att Device ID matchar din ESP8266
- Verifiera Firebase URL (utan https://)
- Kolla att Firebase Security Rules tillåter läsning

### CORS-fel
- Firebase REST API ska inte ge CORS-fel
- Om problem, testa att öppna från localhost-server

### Data uppdateras inte
- Klicka "Ladda data" igen för att uppdatera
- Data cachas inte - alltid senaste från Firebase

## 💡 Tips

- Bokmärk dashboarden i din webbläsare
- Lägg till på mobil hemskärm (PWA-liknande)
- Använd samma dashboard för flera enheter genom att byta Device ID

## 📄 Licens

MIT License - samma som huvudprojektet
