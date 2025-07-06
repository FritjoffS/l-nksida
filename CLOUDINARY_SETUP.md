# Cloudinary Setup Instructions

## Steg 1: Skapa Upload Preset

1. **Logga in på Cloudinary Console:**
   - Gå till https://cloudinary.com/console
   - Logga in med ditt konto

2. **Skapa en Upload Preset:**
   - Gå till "Settings" → "Upload"
   - Klicka på "Add upload preset"
   - Fyll i följande:
     - **Preset name:** `l-nksida-guides`
     - **Signing Mode:** `Unsigned` (viktigt för frontend-uppladdning)
     - **Folder:** `guides` (valfritt, men rekommenderat)
     - **Format:** `Auto`
     - **Quality:** `Auto`
     - **Max file size:** `5 MB`
     - **Allowed formats:** `jpg,jpeg,png,gif,webp`

3. **Spara preset**

## Steg 2: Verifiera dina inställningar

- **Cloud name:** `dmtfxmepd` ✓
- **Upload preset:** `l-nksida-guides` (skapas ovan)

## Steg 3: Testa systemet

1. Öppna admin.html
2. Klicka på "📷 Ladda upp bild till Cloudinary"
3. Välj en bild och ladda upp
4. URL:en ska automatiskt fyllas i formuläret

## Fördelar med Cloudinary

✅ **Inga CORS-problem** - fungerar från alla domäner
✅ **Automatisk bildoptimering** - snabbare laddningstider
✅ **CDN-leverans** - bilder levereras från närmaste server
✅ **Gratis tier** - 25 GB lagring, 25 GB bandbredd/månad
✅ **Säkerhet** - bilder sparas säkert i molnet
✅ **Enkelt** - ingen komplex konfiguration

## Support

Om du får problem:
1. Kontrollera att upload preset `l-nksida-guides` är skapad
2. Verifiera att signing mode är `Unsigned`
3. Kontrollera browser console för felmeddelanden
